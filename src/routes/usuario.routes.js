const express = require('express');
const router = express.Router();
const { getUsuarios, deleteUsuario } = require('../controllers/usuario.controller');

router.get('/', getUsuarios);
router.delete('/:id', deleteUsuario);

module.exports = router;