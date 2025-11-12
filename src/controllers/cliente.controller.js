const pool = require('../config/db');

// Funcion para obtener fecha nac con curp
function obtenerFechaNac(curp) {
  if (!curp || curp.length < 10) return null;

  const anio = curp.substring(4, 6);
  const mes = curp.substring(6, 8);
  const dia = curp.substring(8, 10);
  const anioCompleto = parseInt(anio, 10) < 25 ? `20${anio}` : `19${anio}`;

  return `${anioCompleto}-${mes}-${dia}`;
}

// Registrar clientes
const registrarCliente = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      nombre_cliente,
      app_cliente,
      apm_cliente,
      curp,
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
    // Datos obligatorios del cliente
    if (!nombre_cliente || !app_cliente || !apm_cliente || !curp || !sexo || !municipio) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // Sacar fecha nac con base a la CURP
    const fecha_nacimiento = obtenerFechaNac(curp);
    const estadoBool = estado === true || estado === 'true';

    await client.query('BEGIN');

    // 1 Insertar cliente sin dirección aún
    const clienteResult = await client.query(
      `INSERT INTO cliente (
        folio_cliente, nombre_cliente, app_cliente, apm_cliente, curp, rfc,
        fecha_nacimiento, nacionalidad, ocupacion, ciclo_actual
      ) VALUES (NULL, $1, $2, $3, $4, NULL, $5, $6, $7, $8)
      RETURNING id_cliente`,
      [
        nombre_cliente,
        app_cliente,
        apm_cliente,
        curp,
        fecha_nacimiento,
        nacionalidad,
        ocupacion,
        ciclo_actual
      ]
    );
    const idCliente = clienteResult.rows[0].id_cliente;

    // 2️ Insertar dirección asociada al cliente
    const dirResult = await client.query(
      `INSERT INTO direccion (municipio, localidad, calle, numero, id_cliente)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_direccion`,
      [municipio, localidad, calle, numero, idCliente]
    );
    const idDireccion = dirResult.rows[0].id_direccion;

    // 3️ Actualizar cliente con su dirección
    await client.query(
      `UPDATE cliente SET direccion_id = $1 WHERE id_cliente = $2`,
      [idDireccion, idCliente]
    );

    // 4️ Insertar solicitud
    await client.query(
      `INSERT INTO solicitud (
        cliente_id, usuario_id, fecha_creacion, monto_solicitado, tasa_interes, 
        tasa_moratoria, plazo_meses, no_pagos, tipo_vencimiento, seguro, estado, observaciones, fecha_aprobacion
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL)`,
      [
        idCliente, usuario_id, monto_solicitado, tasa_interes, tasa_moratoria,
        plazo_meses, no_pagos, tipo_vencimiento, seguro, estadoBool, observaciones
      ]
    );

    await client.query('COMMIT');


    res.status(201).json({
      message: 'Cliente registrado correctamente',
      id_cliente: idCliente,
      fecha_nacimiento
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al registrar cliente', error: error.message });
  } finally {
    client.release();
  }
};

// TODO : MOSTRAR CLIENTES
const mostrarClientes = async (req, res) => {
  try {
    // consultar para devolver todos los clientes
    const result = await pool.query(`
      SELECT c.id_cliente, c.nombre_cliente, c.app_cliente, c.apm_cliente, 
             c.curp, c.nacionalidad, c.ocupacion, c.ciclo_actual,
             d.municipio, d.localidad, d.calle, d.numero
      FROM cliente c
      LEFT JOIN direccion d ON c.direccion_id = d.id_direccion
      ORDER BY c.id_cliente ASC;
      `);
      res.status(200).json(result.rows);
  } catch (error){
    console.error('Error al obtener clientes: ', error);
    res.status(500).json({message: 'Error al obtener los clientes', error: error.message})
  }
};

// TODO: MOSTRAR CLIENTE POR ID 
const mostrarCliente = async (req, res) => {
  const {id} = req.params;

  try {
    const result = await pool.query(`
      SELECT c.id_cliente, c.nombre_cliente, c.app_cliente, c.apm_cliente, 
             c.curp, c.nacionalidad, c.ocupacion, c.ciclo_actual,
             d.municipio, d.localidad, d.calle, d.numero
      FROM cliente c
      LEFT JOIN direccion d ON c.direccion_id = d.id_direccion
      WHERE c.id_cliente = $1;
      `, [id]);
      if (result.rows.length === 0){
        return res.status(404).json({message: 'Cliente no encontrado'});
      }
      res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente por ID: ', error);
    res.status(500).json({message: 'Error al obtener cliente', error: error.message})
  }
};
// TODO :  EDITAR CLIENTE
const editarCliente = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      id_cliente,
      nombre_cliente,
      app_cliente,
      apm_cliente,
      curp,
      sexo,
      nacionalidad,
      ocupacion,
      ciclo_actual,
      municipio,
      localidad,
      calle,
      numero,
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

    if (!id_cliente) {
      return res.status(400).json({ message: 'Falta el ID del cliente' });
    }

    await client.query('BEGIN');

    // 1️⃣ Obtener id_direccion asociado al cliente
    const dirQuery = await client.query(
      `SELECT direccion_id FROM cliente WHERE id_cliente = $1`,
      [id_cliente]
    );

    if (dirQuery.rowCount === 0) {
      throw new Error('Cliente no encontrado');
    }

    const idDireccion = dirQuery.rows[0].direccion_id;

    // 2️⃣ Actualizar datos del cliente
    await client.query(
      `UPDATE cliente
       SET nombre_cliente = $1,
           app_cliente = $2,
           apm_cliente = $3,
           curp = $4,
           nacionalidad = $5,
           ocupacion = $6,
           ciclo_actual = $7
       WHERE id_cliente = $8`,
      [
        nombre_cliente,
        app_cliente,
        apm_cliente,
        curp,
        nacionalidad,
        ocupacion,
        ciclo_actual,
        id_cliente
      ]
    );

    // 3️⃣ Actualizar dirección
    if (idDireccion) {
      await client.query(
        `UPDATE direccion
         SET municipio = $1,
             localidad = $2,
             calle = $3,
             numero = $4
         WHERE id_direccion = $5`,
        [municipio, localidad, calle, numero, idDireccion]
      );
    }

    // 4️⃣ Actualizar solicitud más reciente (si aplica)
    const solicitudQuery = await client.query(
      `SELECT id_solicitud FROM solicitud WHERE cliente_id = $1 ORDER BY fecha_creacion DESC LIMIT 1`,
      [id_cliente]
    );

    if (solicitudQuery.rowCount > 0) {
      const idSolicitud = solicitudQuery.rows[0].id_solicitud;

      await client.query(
        `UPDATE solicitud
         SET monto_solicitado = $1,
             tasa_interes = $2,
             tasa_moratoria = $3,
             plazo_meses = $4,
             no_pagos = $5,
             tipo_vencimiento = $6,
             seguro = $7,
             estado = $8,
             observaciones = $9
         WHERE id_solicitud = $10`,
        [
          monto_solicitado,
          tasa_interes,
          tasa_moratoria,
          plazo_meses,
          no_pagos,
          tipo_vencimiento,
          seguro,
          estado,
          observaciones,
          idSolicitud
        ]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Cliente actualizado correctamente',
      id_cliente
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al editar cliente:', error);
    res.status(500).json({ message: 'Error al editar cliente', error: error.message });
  } finally {
    client.release();
  }
};

// TODO : ELIMINAR CLIENTE
const eliminarCliente = async (req, res) => {
  const client = await pool.connect();

  try {
    const id_cliente = req.params.id;

    await client.query('BEGIN');

    // 1. Eliminar solicitudes asociadas a cliente
    await client.query(`DELETE FROM solicitud WHERE cliente_id = $1`, [id_cliente]);
    // 2. Obtener id direccion para eliminar 
    const dirResult =await client.query(
      `SELECT direccion_id FROM cliente WHERE id_cliente = $1`, [id_cliente]
    );
    if (dirResult.rows.length === 0){
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cliente no encontrado'});
    }
    const id_direccion = dirResult.rows[0].direccion_id;

    // 3. Eliminar cliente
    await client.query(`DELETE FROM cliente WHERE id_cliente = $1`, [id_cliente]);

    // 4. Eliminar direccion (si esta existe)

    if (id_direccion) {
      await client.query(`DELETE FROM direccion WHERE id_direccion = $1`, [id_direccion]);
    }

    
    await client.query('COMMIT')
    res.status(200).json({ message: 'Cliente eliminado correctamente' })
    } catch(error){
    await client.query('ROLLBACK')
    console.error('Error al eliminar cliente: ', error);
    res.status(200).json({ message: 'Error al eliminar cliente', error });
  } finally {
    client.release();
  }
}

module.exports = { 
  registrarCliente,
  editarCliente,
  eliminarCliente,
  mostrarClientes,
  mostrarCliente
 };
