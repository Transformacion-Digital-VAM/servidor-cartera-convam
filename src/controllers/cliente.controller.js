const pool = require('../config/db');
const { generarCURP } = require('../utils/curpGenerator');

const registrarCliente = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      nombre_cliente,
      app_cliente,
      apm_cliente,
      fecha_nacimiento,
      sexo,
      nacionalidad,
      ocupacion,
      ciclo_actual,
      municipio,
      localidad,
      calle,
      numero,
      usuario_id,
      monto_solicitado,
      tasa_interes,
      tasa_moratoria,
      plazo_meses,
      no_pagos,
      tipo_vencimiento,
      seguro,
      estado,
      observaciones
    } = req.body;

    if (!nombre_cliente || !app_cliente || !apm_cliente || !fecha_nacimiento || !sexo || !municipio) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const curpGenerada = generarCURP(
      nombre_cliente, app_cliente, apm_cliente, fecha_nacimiento, sexo, nacionalidad
    );

    await client.query('BEGIN');

    // 1. Insertar dirección primero
    const dirResult = await client.query(
      `INSERT INTO direccion (municipio, localidad, calle, numero)
       VALUES ($1, $2, $3, $4) RETURNING id_direccion`,
      [municipio, localidad, calle, numero]
    );
    const idDireccion = dirResult.rows[0].id_direccion;

    // 2️ Insertar cliente con el id_direccion obtenido
    const clienteResult = await client.query(
      `INSERT INTO cliente (
        folio_cliente, nombre_cliente, app_cliente, apm_cliente, curp, rfc,
        fecha_nacimiento, nacionalidad, direccion_id, ocupacion, ciclo_actual
      ) VALUES (NULL, $1, $2, $3, $4, NULL, $5, $6, $7, $8, $9)
      RETURNING id_cliente`,
      [
        nombre_cliente, app_cliente, apm_cliente,
        curpGenerada,
        fecha_nacimiento, nacionalidad, idDireccion,
        ocupacion, ciclo_actual
      ]
    );
    const idCliente = clienteResult.rows[0].id_cliente;

    // 3️ Insertar solicitud de crédito
    await client.query(
      `INSERT INTO solicitud (
        cliente_id, usuario_id, fecha_creacion, monto_solicitado, tasa_interes, 
        tasa_moratoria, plazo_meses, no_pagos, tipo_vencimiento, seguro, estado, observaciones, fecha_aprobacion
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL)`,
      [
        idCliente, usuario_id, monto_solicitado, tasa_interes, tasa_moratoria,
        plazo_meses, no_pagos, tipo_vencimiento, seguro, estado, observaciones
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Cliente registrado correctamente',
      id_cliente: idCliente,
      curp: curpGenerada
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al registrar cliente', error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { registrarCliente };
