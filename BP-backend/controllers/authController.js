const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../utils/emailService');
const db = require('../config/db');

const authController = {
  // Registrace nového uživatele
  async register(req, res) {
    try {
      const { 
        firstName, lastName, email, password, phone,
        companyName, street, city, zipCode,
        termsAccepted, privacyAccepted, marketingAccepted
      } = req.body;
	console.log('Kompletní registrační data:', {
      firstName, lastName, email, 
      passwordLength: password ? password.length : 0,
      phoneLength: phone ? phone.length : 0, 
      companyName, 
      streetLength: street ? street.length : 0, 
      city, 
      zipCodeLength: zipCode ? zipCode.length : 0
    });
      // Kontrola, zda e-mail již existuje
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Uživatel s tímto e-mailem již existuje' });
      }

      // Vytvoření verifikačního tokenu
      const verificationToken = uuidv4();

      // Příprava dat pro vytvoření uživatele
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone,
        company_name: companyName || null,
        street: street || null,
        city: city || null,
        zip_code: zipCode || null,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        marketing_accepted: marketingAccepted || false,
        verification_token: verificationToken
      };

      // Vytvoření uživatele v databázi
      const newUser = await userModel.create(userData);

      // Odeslání verifikačního e-mailu
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      await emailService.sendVerificationEmail(email, firstName, verificationUrl);

      res.status(201).json({ 
        message: 'Registrace byla úspěšná. Zkontrolujte svůj e-mail pro ověření účtu.',
        user: {
          id: newUser.id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error('Chyba při registraci:', error);
      res.status(500).json({ error: 'Při registraci došlo k chybě. Zkuste to prosím znovu.' });
    }
  },

  // Přihlášení uživatele
  async login(req, res) {
    try {
      const { email, password, remember } = req.body;

      // Načtení uživatele z databáze
      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
      }

      // Pokud uživatel nemá nastavené heslo (jen Google přihlášení)
      if (!user.password_hash) {
        return res.status(401).json({ 
          error: 'Tento účet používá přihlášení přes Google. Použijte prosím tlačítko pro přihlášení přes Google.' 
        });
      }

      // Kontrola, zda byl účet ověřen
      if (!user.is_verified) {
        return res.status(401).json({ 
          error: 'Váš účet není ověřen. Zkontrolujte svůj e-mail a dokončete registraci.' 
        });
      }

      // Ověření hesla
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
      }

      // Vytvoření JWT tokenu
      const expiresIn = remember ? '30d' : process.env.JWT_EXPIRES_IN;
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn }
      );

      // Aktualizace data posledního přihlášení
      await userModel.update(user.id, { last_login: new Date() });

      // Odeslání odpovědi
      res.status(200).json({
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          companyName: user.company_name
        }
      });
    } catch (error) {
      console.error('Chyba při přihlašování:', error);
      res.status(500).json({ error: 'Při přihlašování došlo k chybě. Zkuste to prosím znovu.' });
    }
  },

  // Ověření e-mailu
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      // Nalezení a ověření uživatele
      const user = await userModel.verifyUser(token);
      
      if (!user) {
        return res.status(400).json({ error: 'Neplatný nebo expirovaný verifikační odkaz' });
      }
      
      res.status(200).json({ message: 'E-mail byl úspěšně ověřen. Nyní se můžete přihlásit.' });
    } catch (error) {
      console.error('Chyba při ověřování e-mailu:', error);
      res.status(500).json({ error: 'Při ověřování e-mailu došlo k chybě. Zkuste to prosím znovu.' });
    }
  },

  // Zaslání e-mailu pro reset hesla
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Nalezení uživatele
      const user = await userModel.findByEmail(email);
      if (!user) {
        // Z bezpečnostních důvodů neříkáme, že uživatel neexistuje
        return res.status(200).json({ 
          message: 'Pokud je e-mail registrován, pošleme vám instrukce pro reset hesla.' 
        });
      }
      
      // Vytvoření tokenu pro reset hesla
      const resetToken = uuidv4();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Token platný 1 hodinu
      
      // Uložení tokenu do databáze
      await userModel.setResetPasswordToken(email, resetToken, resetExpires);
      
      // Odeslání e-mailu s odkazem pro reset hesla
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await emailService.sendPasswordResetEmail(email, user.first_name, resetUrl);
      
      res.status(200).json({ 
        message: 'Pokud je e-mail registrován, pošleme vám instrukce pro reset hesla.' 
      });
    } catch (error) {
      console.error('Chyba při žádosti o reset hesla:', error);
      res.status(500).json({ 
        error: 'Při zpracování žádosti o reset hesla došlo k chybě. Zkuste to prosím znovu.' 
      });
    }
  },

  // Reset hesla
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      // Nalezení uživatele podle tokenu
      const query = `
        SELECT id, reset_password_expires
        FROM users
        WHERE reset_password_token = $1
      `;
      
      const result = await db.query(query, [token]);
      const user = result.rows[0];
      
      if (!user) {
        return res.status(400).json({ error: 'Neplatný nebo expirovaný odkaz pro reset hesla' });
      }
      
      // Kontrola expirace tokenu
      if (new Date() > new Date(user.reset_password_expires)) {
        return res.status(400).json({ error: 'Odkaz pro reset hesla vypršel' });
      }
      
      // Aktualizace hesla
      await userModel.updatePassword(user.id, password);
      
      res.status(200).json({ message: 'Heslo bylo úspěšně změněno. Nyní se můžete přihlásit.' });
    } catch (error) {
      console.error('Chyba při resetování hesla:', error);
      res.status(500).json({ error: 'Při resetování hesla došlo k chybě. Zkuste to prosím znovu.' });
    }
  },
// Změna hesla
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id; // Získáno z auth middleware
      
      // Načtení uživatele z databáze
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Uživatel nebyl nalezen' });
      }
      
      // Ověření současného hesla
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Současné heslo není správné' });
      }
      
      // Aktualizace hesla
      await userModel.updatePassword(userId, newPassword);
      
      res.status(200).json({ message: 'Heslo bylo úspěšně změněno' });
    } catch (error) {
      console.error('Chyba při změně hesla:', error);
      res.status(500).json({ error: 'Při změně hesla došlo k chybě. Zkuste to prosím znovu.' });
    }
  }
};

module.exports = authController;
