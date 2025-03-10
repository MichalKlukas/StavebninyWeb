const userModel = require('../models/userModel');

const userController = {
  // Aktualizace profilu uživatele
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { 
        firstName, lastName, phone, 
        street, city, zipCode,
        companyName, ico, dic
      } = req.body;
      
      // Příprava dat pro aktualizaci
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        phone,
        street: street || null,
        city: city || null,
        zip_code: zipCode || null,
        company_name: companyName || null,
        ico: ico || null,
        dic: dic || null
      };
      
      // Aktualizace uživatele v databázi
      const updatedUser = await userModel.update(userId, updateData);
      
      // Příprava dat pro odpověď
      const userData = {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        street: updatedUser.street,
        city: updatedUser.city,
        zipCode: updatedUser.zip_code,
        companyName: updatedUser.company_name,
        ico: updatedUser.ico,
        dic: updatedUser.dic
      };
      
      res.status(200).json({ 
        message: 'Profil byl úspěšně aktualizován',
        user: userData
      });
    } catch (error) {
      console.error('Chyba při aktualizaci profilu:', error);
      res.status(500).json({ error: 'Při aktualizaci profilu došlo k chybě. Zkuste to prosím znovu.' });
    }
  }
};

module.exports = userController;