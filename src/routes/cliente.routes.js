const express = require('express');
const router = express.Router();
const { registrarCliente } = require('../controllers/cliente.controller');
const { editarCliente } = require('../controllers/cliente.controller');
const { mostrarClientes } = require('../controllers/cliente.controller');
const { mostrarCliente } = require('../controllers/cliente.controller');
const { eliminarCliente } = require('../controllers/cliente.controller');
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

// ENDPOINT: mostrar cliente id
router.get('/obtener/:id', mostrarCliente)

// ENDPOINT: mostrar clientes
router.get('/obtener', mostrarClientes)

// ENDPOINT: eliminar cliente
router.put('/editar/:id', editarCliente);

// ENDPOINT: eliminar cliente
router.delete('/eliminar/:id', eliminarCliente);

module.exports = router;  
