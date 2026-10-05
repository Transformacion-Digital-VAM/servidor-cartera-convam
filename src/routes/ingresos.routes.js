const express = require('express');
const router = express.Router();
const { obtenerIngresos } = require('../controllers/ingresos.controller');

router.get('/', obtenerIngresos);

module.exports = router;