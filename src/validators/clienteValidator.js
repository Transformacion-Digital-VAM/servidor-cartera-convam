const { body } = require('express-validator');

exports.validarRegistroCliente = [
  // Campos personales
  body('nombre_cliente')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('app_cliente')
    .notEmpty().withMessage('El apellido paterno es obligatorio'),
  body('apm_cliente')
    .notEmpty().withMessage('El apellido materno es obligatorio'),

  // Fecha de nacimiento
  body('fecha_nacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
    .isISO8601().withMessage('La fecha de nacimiento no es válida'),

  // Sexo y nacionalidad
  body('sexo')
    .notEmpty().withMessage('El sexo es obligatorio')
    .isIn(['H', 'M']).withMessage('El sexo debe ser H o M'),
  body('nacionalidad')
    .notEmpty().withMessage('La nacionalidad es obligatoria'),

  // Dirección
  body('municipio')
    .notEmpty().withMessage('El municipio es obligatorio'),
  body('localidad')
    .notEmpty().withMessage('La localidad es obligatoria'),
  body('calle')
    .notEmpty().withMessage('La calle es obligatoria'),
  body('numero')
    .notEmpty().withMessage('El número es obligatorio'),

  // Datos del crédito
  body('usuario_id')
    .isInt().withMessage('El ID del usuario debe ser un número entero'),
  body('monto_solicitado')
    .isFloat({ gt: 0 }).withMessage('El monto solicitado debe ser un número positivo'),
  body('tasa_interes')
    .isFloat({ gt: 0 }).withMessage('La tasa de interés debe ser un número positivo'),
  body('tasa_moratoria')
    .isFloat({ gt: 0 }).withMessage('La tasa moratoria debe ser un número positivo'),
  body('plazo_meses')
    .isInt({ gt: 0 }).withMessage('El plazo en meses debe ser un número entero positivo'),
  body('no_pagos')
    .isInt({ gt: 0 }).withMessage('El número de pagos debe ser un número entero positivo'),
  body('tipo_vencimiento')
    .notEmpty().withMessage('El tipo de vencimiento es obligatorio'),
  body('seguro')
    .isFloat({ min: 0 }).withMessage('El seguro debe ser un número mayor o igual a 0'),
  body('estado')
    .notEmpty().withMessage('El estado es obligatorio')
];
