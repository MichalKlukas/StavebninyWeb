const express = require("express");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuthController");

// Google OAuth callback route
router.post("/auth/google/callback", googleAuthController.googleCallback);

module.exports = router;

