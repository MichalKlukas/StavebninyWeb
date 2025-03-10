const express = require('express');
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const auth = require('../middleware/auth');

const router = express.Router();

// Validace pro registraci
const registerValidation = [
  body('firstName').notEmpty().withMessage('Zadejte prosím jméno'),
  body('lastName').notEmpty().withMessage('Zadejte prosím příjmení'),
  body('email').isEmail().withMessage('Zadejte platný e-mail'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Heslo musí mít alespoň 8 znaků')
    .matches(/\d/)
    .withMessage('Heslo musí obsahovat alespoň jedno číslo'),
  body('phone').notEmpty().withMessage('Zadejte prosím telefonní číslo'),
  body('termsAccepted').equals('true').withMessage('Musíte souhlasit s obchodními podmínkami'),
  body('privacyAccepted').equals('true').withMessage('Musíte souhlasit se zpracováním osobních údajů')
];

// Validace pro přihlášení
const loginValidation = [
  body('email').isEmail().withMessage('Zadejte platný e-mail'),
  body('password').notEmpty().withMessage('Zadejte heslo')
];

// Validace pro reset hesla
const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Heslo musí mít alespoň 8 znaků')
    .matches(/\d/)
    .withMessage('Heslo musí obsahovat alespoň jedno číslo')
];

// Registrace nového uživatele
router.post('/register', registerValidation, validateRequest, authController.register);

// Přihlášení
router.post('/login', loginValidation, validateRequest, authController.login);

// Ověření e-mailu
router.get('/verify-email/:token', authController.verifyEmail);

// Zapomenuté heslo
router.post('/forgot-password', 
  body('email').isEmail().withMessage('Zadejte platný e-mail'),
  validateRequest,
  authController.forgotPassword
);

// Reset hesla
router.post('/reset-password/:token', 
  resetPasswordValidation, 
  validateRequest,
  authController.resetPassword
);

// Změna hesla
router.post('/change-password', auth, authController.changePassword);

module.exports = router;