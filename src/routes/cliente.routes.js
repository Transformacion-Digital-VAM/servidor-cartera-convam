const express = require('express');
const router = express.Router();
const { registrarCliente } = require('../controllers/cliente.controller');
const { validarRegistroCliente } = require('../validators/clienteValidator');
const { validationResult } = require('express-validator');

router.post('/registrar', validarRegistroCliente, (req, res, next) => {
  // Manejo de errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
}, registrarCliente);

module.exports = router;
