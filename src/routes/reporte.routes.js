// const express = require('express');
// const router = express.Router();
// const TreasuryController = require('../controllers/tesorera.controller');

// // Reportes de Tesorería
// router.get('/tesoreria/ministraciones', TreasuryController.getMinistrationsReport);
// router.get('/tesoreria/capital-cartera', TreasuryController.getCapitalReport);
// router.get('/tesoreria/detalle-pagos', TreasuryController.getPaymentDetailReport);
// router.get('/tesoreria/resumen-cartera', TreasuryController.getPortfolioSummary);
// router.get('/tesoreria/filtros', TreasuryController.getFilterOptions);
// <<<<<<< HEAD

// =======
// // Exportar dashboard (NUEVA RUTA)
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
// module.exports = router;
const express = require('express');
const router = express.Router();
const TreasuryController = require('../controllers/tesorera.controller');

// Reportes de Tesorería
router.get('/tesoreria/ministraciones', TreasuryController.getMinistrationsReport);
router.get('/tesoreria/capital-cartera', TreasuryController.getCapitalReport);
router.get('/tesoreria/detalle-pagos', TreasuryController.getPaymentDetailReport);
router.get('/tesoreria/resumen-cartera', TreasuryController.getPortfolioSummary);
router.get('/tesoreria/filtros', TreasuryController.getFilterOptions);
// Exportar dashboard (NUEVA RUTA)
module.exports = router;