const express = require('express');
const router = express.Router();
const TreasuryController = require('../controllers/tesorera.controller');

// Exportar datos del dashboard
router.get('/exportar', TreasuryController.exportDashboard);

module.exports = router;
