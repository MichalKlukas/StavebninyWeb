// routes/dunaApiRoutes.js
const express = require('express');
const router = express.Router();
//const basicAuth = require('../middleware/basicAuthMiddleware');
const upload = require('../middleware/uploadMiddleware');
const dunaController = require('../controllers/dunaController');

// Aplikace middleware na všechny DUNA API endpointy
//router.use(basicAuth);

// Test připojení (eshopStatus)
router.get('/eshopStatus', dunaController.getStatus);

// Import sortimentu
router.post('/import', upload.single('zipfile'), dunaController.importProducts);

// Aktualizace stavu skladu
router.post('/update/stockitem', dunaController.updateStockItem);

// Export objednávek
router.get('/getOrders', dunaController.getOrders);

// Export dokumentů
router.get('/getDocuments', dunaController.getDocuments);

module.exports = router;
