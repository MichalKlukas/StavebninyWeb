// userController.js
const userModel = require('../models/userModel');

const userController = {
  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      console.log('Getting profile for user ID:', userId);
      
      // Get user from database
      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'Uživatel nebyl nalezen.'
        });
      }
      
      // Příprava dat pro odpověď
      const userData = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        street: user.street,
        city: user.city,
        zip_code: user.zip_code,
        company_name: user.company_name,
        ico: user.ico,
        dic: user.dic
      };
      
      res.status(200).json({
        user: userData
      });
    } catch (error) {
      console.error('Chyba při získání profilu:', error);
      res.status(500).json({
        error: 'Při získání profilu došlo k chybě. Zkuste to prosím znovu.'
      });
    }
  },

  // Aktualizace profilu uživatele
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      
      // Enhanced logging
      console.log('Updating profile for user ID:', userId);
      console.log('Update data received:', JSON.stringify(req.body));
      
      const {
        first_name,
        last_name,
        phone,
        street,
        city,
        zip_code,
        company_name,
        ico,
        dic
      } = req.body;

      // Příprava dat pro aktualizaci
      const updateData = {
        first_name,
        last_name,
        phone,
        street: street || null,
        city: city || null,
        zip_code: zip_code || null,
        company_name: company_name || null,
        ico: ico || null,
        dic: dic || null
      };

      console.log('Prepared update data:', JSON.stringify(updateData));

      // Aktualizace uživatele v databázi
      const updatedUser = await userModel.update(userId, updateData);
      
      // Log update result
      console.log('User updated successfully, returned data:', JSON.stringify(updatedUser));

      // Příprava dat pro odpověď
      const userData = {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        street: updatedUser.street,
        city: updatedUser.city,
        zip_code: updatedUser.zip_code,
        company_name: updatedUser.company_name,
        ico: updatedUser.ico,
        dic: updatedUser.dic
      };

      res.status(200).json({
        message: 'Profil byl úspěšně aktualizován',
        user: userData
      });
    } catch (error) {
      console.error('Chyba při aktualizaci profilu:', error);
      res.status(500).json({
        error: 'Při aktualizaci profilu došlo k chybě. Zkuste to prosím znovu.'
      });
    }
  }
};

module.exports = userController;
