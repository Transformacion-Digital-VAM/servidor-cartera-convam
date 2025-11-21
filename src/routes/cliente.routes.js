const express = require('express');
const router = express.Router();
const { editarCliente } = require('../controllers/cliente.controller');
const { mostrarClientes } = require('../controllers/cliente.controller');
const { mostrarCliente } = require('../controllers/cliente.controller');
const { eliminarCliente } = require('../controllers/cliente.controller');
const clienteController = require('../controllers/cliente.controller');
const avalController = require('../controllers/aval.controller');


// Nuevas rutas para guardado por partes
router.post('/direccion', clienteController.guardarDireccion);
router.post('/cliente', clienteController.guardarCliente);


// ENDPOINT: mostrar cliente id
router.get('/obtener/:id', mostrarCliente)

// ENDPOINT: mostrar clientes
router.get('/cliente', mostrarClientes)

// ENDPOINT: eliminar cliente
router.put('/editar/:id', editarCliente);

// ENDPOINT: eliminar cliente
router.delete('/eliminar/:id', eliminarCliente);
// ENDPOINTs: Avales
//Guardar aval
router.post('/aval', avalController.guardarAval);
// Listar todos los avales
router.get('/aval', avalController.listarAvales);
// Editar informacion de aval
router.put('/aval/:id_aval', avalController.editarAval);
// Eliminar aval
http://localhost:3000/cliente/aval/2
router.delete('/aval/:id_aval', avalController.eliminarAval);
// Obtener aval por cliente
// http://localhost:3000/cliente/aval/14
router.get('/aval/:cliente_id', avalController.obtenerAvalesPorCliente);


module.exports = router;