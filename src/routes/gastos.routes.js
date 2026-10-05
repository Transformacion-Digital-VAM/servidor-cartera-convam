const express = require('express');
const router = express.Router();
const {
    obtenerCategorias,
    crearCategoria,
    obtenerGastos,
    crearGasto,
    actualizarGasto,
    eliminarGasto
} = require('../controllers/gastos.controller');

// Categorías de gastos
router.get('/categorias', obtenerCategorias);
router.post('/categorias', crearCategoria);

// Gastos
router.get('/', obtenerGastos);
router.post('/', crearGasto);
router.put('/:id', actualizarGasto);
router.delete('/:id', eliminarGasto);

module.exports = router;
