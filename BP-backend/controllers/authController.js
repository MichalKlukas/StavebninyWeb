const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../utils/emailService');
const db = require('../config/db');

const authController = {
  // Login method with debugging
  async login(req, res) {
    try {
      const { email, password, remember } = req.body;
      console.log(`Attempting login for: ${email}`);
      
      // Find user in database
      const user = await userModel.findByEmail(email);
      if (!user) {
        console.log(`User not found: ${email}`);
        return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
      }
      
      console.log(`User found: ${email}, verification: ${user.is_verified}`);
      
      // Check for Google account
      if (!user.password_hash) {
        console.log(`No password hash for: ${email} (Google account)`);
        return res.status(401).json({
          error: 'Tento účet používá přihlášení přes Google. Použijte prosím tlačítko pro přihlášení přes Google.'
        });
      }
      
      // Check verification
      if (!user.is_verified) {
        console.log(`Account not verified: ${email}`);
        return res.status(401).json({
          error: 'Váš účet není ověřen. Zkontrolujte svůj e-mail a dokončete registraci.'
        });
      }
      
      // Verify password
      console.log(`Comparing password for: ${email}`);
      const validPassword = await bcrypt.compare(password, user.password_hash);
      console.log(`Password valid: ${validPassword}`);
      
      if (!validPassword) {
        console.log(`Invalid password for: ${email}`);
        return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
      }
      
      // Create token
      const expiresIn = remember ? '30d' : process.env.JWT_EXPIRES_IN;
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn }
      );
      
      // Update last login
      await userModel.update(user.id, { last_login: new Date() });
      
      console.log(`Login successful for: ${email}`);
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
      console.error('Login error:', error);
      res.status(500).json({ error: 'Při přihlašování došlo k chybě.' });
    }
  },

  // Register
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
      
      // Check if email exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Uživatel s tímto e-mailem již existuje' });
      }

      // Create verification token
      const verificationToken = uuidv4();

      // Prepare user data
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

      // Create user
      const newUser = await userModel.create(userData);

      // Send verification email
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
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Při registraci došlo k chybě.' });
    }
  },

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      // Find and verify user
      const user = await userModel.verifyUser(token);
      
      if (!user) {
        return res.status(400).json({ error: 'Neplatný nebo expirovaný verifikační odkaz' });
      }
      
      res.status(200).json({ message: 'E-mail byl úspěšně ověřen. Nyní se můžete přihlásit.' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Při ověřování e-mailu došlo k chybě.' });
    }
  },

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      // Find user
      const user = await userModel.findByEmail(email);
      if (!user) {
        // Security: don't reveal that user doesn't exist
        return res.status(200).json({ 
          message: 'Pokud je e-mail registrován, pošleme vám instrukce pro reset hesla.' 
        });
      }
      
      // Create reset token
      const resetToken = uuidv4();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Valid for 1 hour
      
      // Save token
      await userModel.setResetPasswordToken(email, resetToken, resetExpires);
      
      // Send email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await emailService.sendPasswordResetEmail(email, user.first_name, resetUrl);
      
      res.status(200).json({ 
        message: 'Pokud je e-mail registrován, pošleme vám instrukce pro reset hesla.' 
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ 
        error: 'Při zpracování žádosti o reset hesla došlo k chybě.' 
      });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      // Find user by token
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
      
      // Check expiration
      if (new Date() > new Date(user.reset_password_expires)) {
        return res.status(400).json({ error: 'Odkaz pro reset hesla vypršel' });
      }
      
      // Update password
      await userModel.updatePassword(user.id, password);
      
      res.status(200).json({ message: 'Heslo bylo úspěšně změněno. Nyní se můžete přihlásit.' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Při resetování hesla došlo k chybě.' });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      // Get user
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Uživatel nebyl nalezen' });
      }
      
      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Současné heslo není správné' });
      }
      
      // Update password
      await userModel.updatePassword(userId, newPassword);
      
      res.status(200).json({ message: 'Heslo bylo úspěšně změněno' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Při změně hesla došlo k chybě.' });
    }
  }
};

module.exports = authController;
