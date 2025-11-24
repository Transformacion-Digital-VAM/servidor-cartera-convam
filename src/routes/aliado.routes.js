const express = require('express');
const router = express.Router();
const { obtenerAliados, obtenerAliadoPorId, guardarAliado, editarAliado, eliminarAliado } = require('../controllers/aliado.controller');

router.get('/', obtenerAliados);
router.get('/:id_aliado', obtenerAliadoPorId);
router.post('/', guardarAliado);
router.put('/:id_aliado', editarAliado);
router.delete('/:id_aliado', eliminarAliado);

module.exports = router;