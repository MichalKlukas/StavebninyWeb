// middleware/uploadMiddleware.js
const multer = require('multer');

// Konfigurace multer pro ukládání do paměti (ne na disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit velikosti souboru
  }
});

module.exports = upload;