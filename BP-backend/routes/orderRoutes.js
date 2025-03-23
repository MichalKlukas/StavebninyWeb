// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Create a new order
router.post('/orders', auth, orderController.createOrder);

// Get all orders for the authenticated user
router.get('/orders', auth, orderController.getUserOrders);

// Get a specific order by ID
router.get('/orders/:id', auth, orderController.getOrderById);

// Calculate shipping cost
router.post('/calculate-shipping', auth, orderController.calculateShippingCost);

// Debug endpoint for testing the Google Maps API
router.get('/test-google-api-key', (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  res.json({
    keyExists: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyFirstFive: apiKey ? apiKey.substring(0, 5) : null
  });
});

// Debug endpoint for directly testing shipping calculation
router.post('/test-shipping-calculation', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !address.street || !address.city || !address.zip) {
      return res.status(400).json({
        success: false,
        message: 'Address is required with street, city, and zip'
      });
    }
    
    // Formatted address string for Google Maps API
    const formattedAddress = `${address.street}, ${address.city}, ${address.zip}, Czech Republic`;
    const storeLocation = 'Lysá nad Labem, Sokolovská 1143, Czech Republic';
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key is not configured'
      });
    }
    
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
    
    console.log('Test shipping calculation for address:', formattedAddress);
    
    const axios = require('axios');
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline'
      }
    });
    
    if (!response.data || !response.data.routes || !response.data.routes[0]) {
      return res.status(500).json({
        success: false,
        message: 'No route found in the Google API response'
      });
    }
    
    const distanceMeters = response.data.routes[0].distanceMeters;
    const distanceKm = distanceMeters / 1000;
    const baseCost = 500;
    const costPerKm = 30;
    const shippingCost = Math.round(baseCost + (costPerKm * distanceKm));
    
    res.json({
      success: true,
      request: requestBody,
      responseStatus: response.status,
      distance: {
        meters: distanceMeters,
        kilometers: distanceKm,
        formatted: `${distanceKm.toFixed(1)} km`
      },
      cost: {
        baseCost,
        costPerKm,
        total: shippingCost,
        formatted: `${shippingCost} Kč`
      }
    });
  } catch (error) {
    console.error('Test shipping calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing shipping calculation',
      error: error.message,
      responseData: error.response ? error.response.data : null,
      responseStatus: error.response ? error.response.status : null
    });
  }
});

module.exports = router;
