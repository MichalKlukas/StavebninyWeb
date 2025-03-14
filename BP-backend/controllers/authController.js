const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../utils/emailService');
const db = require('../config/db');

const authController = {
  // Your existing methods from the previous file
};

module.exports = authController;
