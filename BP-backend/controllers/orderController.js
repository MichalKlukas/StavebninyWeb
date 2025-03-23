// controllers/orderController.js
const db = require('../config/db');
const axios = require('axios');
const emailService = require('../utils/emailService');

const orderController = {
  // Create a new order
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const {
        items,
        shipping,
        customer,
        note,
        total
      } = req.body;

      console.log(`Creating order for user ID: ${userId}`);
      console.log('Order data:', JSON.stringify(req.body, null, 2));

      // Start a transaction
      await db.query('BEGIN');

      // 1. Create the order record
      const orderResult = await db.query(
        `INSERT INTO orders (
          user_id,
          status,
          shipping_method,
          shipping_address,
          shipping_cost,
          pickup_date,
          customer_name,
          customer_email,
          customer_phone,
          company_name,
          ico,
          dic,
          note,
          total_price,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) RETURNING id`,
        [
          userId,
          'new', // Initial status
          shipping.method || 'pickup', // Default to pickup if not specified
          shipping.address ? JSON.stringify(shipping.address) : null,
          shipping.cost || 0,
          shipping.pickupDate,
          customer.name,
          customer.email,
          customer.phone,
          customer.company || null,
          customer.ico || null,
          customer.dic || null,
          note || null,
          total || 0
        ]
      );

      const orderId = orderResult.rows[0].id;
      console.log(`Order created with ID: ${orderId}`);

      // 2. Create order items
      for (const item of items) {
        await db.query(
          `INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            price,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            orderId,
            item.productId,
            item.name,
            item.quantity,
            item.price
          ]
        );
      }

      // 3. Clear the user's cart
      await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      // Commit transaction
      await db.query('COMMIT');

      // 4. Send order confirmation email
      try {
        await emailService.sendOrderConfirmationEmail(
          customer.email,
          customer.name,
          orderId,
          items,
          shipping,
          total
        );
        console.log(`Order confirmation email sent to: ${customer.email}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Continue with order creation even if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Objednávka byla úspěšně vytvořena',
        orderId
      });
    } catch (error) {
      // Rollback transaction in case of error
      await db.query('ROLLBACK');

      console.error('Order creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Při vytváření objednávky došlo k chybě',
        error: error.message
      });
    }
  },

  // Get all orders for the authenticated user
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      console.log(`Getting orders for user ID: ${userId}`);

      const result = await db.query(
        `SELECT
          o.id,
          o.status,
          o.shipping_method,
          o.shipping_cost,
          o.pickup_date,
          o.total_price,
          o.created_at
        FROM
          orders o
        WHERE
          o.user_id = $1
        ORDER BY
          o.created_at DESC`,
        [userId]
      );

      res.status(200).json({
        success: true,
        orders: result.rows
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Při načítání objednávek došlo k chybě',
        error: error.message
      });
    }
  },

  // Get specific order by ID
  async getOrderById(req, res) {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;
      console.log(`Getting order ID: ${orderId} for user ID: ${userId}`);

      // Get order details
      const orderResult = await db.query(
        `SELECT
          o.id,
          o.status,
          o.shipping_method,
          o.shipping_address,
          o.shipping_cost,
          o.pickup_date,
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          o.company_name,
          o.ico,
          o.dic,
          o.note,
          o.total_price,
          o.created_at
        FROM
          orders o
        WHERE
          o.id = $1 AND o.user_id = $2`,
        [orderId, userId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Objednávka nebyla nalezena'
        });
      }

      const order = orderResult.rows[0];

      // Get order items
      const itemsResult = await db.query(
        `SELECT
          oi.id,
          oi.product_id,
          oi.product_name,
          oi.quantity,
          oi.price
        FROM
          order_items oi
        WHERE
          oi.order_id = $1`,
        [orderId]
      );

      // Combine order with its items
      order.items = itemsResult.rows;

      res.status(200).json({
        success: true,
        order
      });
    } catch (error) {
      console.error('Get order by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Při načítání objednávky došlo k chybě',
        error: error.message
      });
    }
  },

  // Calculate shipping cost based on address using Routes API
  async calculateShippingCost(req, res) {
    try {
      const { address } = req.body;
      console.log('Calculating shipping cost for address:', address);

      if (!address || !address.street || !address.city || !address.zip) {
        return res.status(400).json({
          success: false,
          message: 'Chybí adresa pro výpočet ceny dopravy'
        });
      }

      // Formatted address string for Google Maps API
      const formattedAddress = `${address.street}, ${address.city}, ${address.zip}, Czech Republic`;

      // Store location (Lysá nad Labem, Sokolovská 1143)
      const storeLocation = 'Lysá nad Labem, Sokolovská 1143, Czech Republic';

      // Get API key from environment variables
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      console.log('Using Google Maps API key:', apiKey ? 'Key exists' : 'No API key found');

      if (!apiKey) {
        console.warn('Google Maps API key is not set. Using simplified calculation.');
        // Fallback to simplified calculation if API key is not set
        return useFallbackCalculation(res);
      }

      // Use the Routes API
      const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;
      const requestBody = {
        origin: {
          address: storeLocation
        },
        destination: {
          address: formattedAddress
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false
        },
        languageCode: "cs-CZ",
        units: "METRIC"
      };

      console.log('Calling Google Routes API with request:', JSON.stringify(requestBody));
      
      try {
        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline'
          }
        });

        console.log('Google API response status:', response.status);
        console.log('Google API response contains routes:', !!response.data.routes);

        // Extract distance information from the routes response
        if (!response.data || !response.data.routes || !response.data.routes[0]) {
          console.error('No route found in the response');
          throw new Error('No route found in the response');
        }

        const distanceMeters = response.data.routes[0].distanceMeters;
        const distanceKm = distanceMeters / 1000;
        const distanceText = `${distanceKm.toFixed(1)} km`;

        console.log(`Calculated distance: ${distanceText}`);

        // Calculate shipping cost
        const baseCost = 500;
        const costPerKm = 30;
        const shippingCost = Math.round(baseCost + (costPerKm * distanceKm));

        console.log(`Calculated shipping cost: ${shippingCost} Kč`);

        // Return the results
        return res.status(200).json({
          success: true,
          distance: {
            text: distanceText,
            value: Math.round(distanceKm * 10) / 10 // Round to 1 decimal place
          },
          cost: shippingCost,
          details: {
            baseCost,
            costPerKm,
            hydraulicArmFee: 100 // Per pallet
          }
        });
      } catch (apiError) {
        console.error('Google Routes API error:', apiError.message);
        if (apiError.response) {
          console.error('API response data:', apiError.response.data);
          console.error('API response status:', apiError.response.status);
        }
        throw apiError; // Re-throw to be caught by the outer try/catch
      }
    } catch (error) {
      console.error('Shipping cost calculation error:', error);
      return useFallbackCalculation(res);
    }
  }
};

// Helper function for fallback calculation
function useFallbackCalculation(res) {
  const distance = Math.round((Math.random() * 30 + 5) * 10) / 10;
  const baseCost = 500;
  const costPerKm = 30;
  const shippingCost = Math.round(baseCost + (costPerKm * distance));

  console.log('Using fallback distance calculation');

  return res.status(200).json({
    success: true,
    distance: {
      text: `${distance} km (odhad)`,
      value: distance
    },
    cost: shippingCost,
    details: {
      baseCost,
      costPerKm,
      hydraulicArmFee: 100,
      isEstimate: true
    }
  });
}

module.exports = orderController;
