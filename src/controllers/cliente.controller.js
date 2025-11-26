const pool = require('../config/db');

// Función para obtener fecha de nacimiento desde CURP 
function obtenerFechaNac(curp) {
  if (!curp || curp.length < 10) return null;
  const anio = curp.substring(4, 6);
  const mes = curp.substring(6, 8);
  const dia = curp.substring(8, 10);
  const anioCompleto = parseInt(anio, 10) < 25 ? `20${anio}` : `19${anio}`;

  if (isNaN(parseInt(mes)) || isNaN(parseInt(dia))) {
    return null;
  }

  return `${anioCompleto}-${mes}-${dia}`;
}

// Guardar solo dirección
const guardarDireccion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { municipio, localidad, calle, numero } = req.body;

    const direccionQuery = `
      INSERT INTO direccion (municipio, localidad, calle, numero) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id_direccion
    `;

    const direccionResult = await client.query(direccionQuery, [
      municipio, localidad, calle, numero
    ]);

    res.status(201).json({
      message: 'Dirección guardada exitosamente',
      id_direccion: direccionResult.rows[0].id_direccion
    });

  } catch (error) {
    console.error('Error al guardar dirección:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

/** CLIENTE */
// Guardar solo cliente
const guardarCliente = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      folio_cliente,
      nombre_cliente,
      app_cliente,
      apm_cliente,
      curp,
      rfc,
      nacionalidad,
      ocupacion,
      ciclo_actual,
      telefono,
      direccion_id
    } = req.body;

    // Validar dirección existente
    const direccionExistente = await client.query(
      'SELECT id_direccion FROM direccion WHERE id_direccion = $1',
      [direccion_id]
    );

    if (direccionExistente.rows.length === 0) {
      return res.status(400).json({
        error: 'Dirección no encontrada',
        message: 'La dirección especificada no existe'
      });
    }

    // Obtener fecha nacimiento desde la CURP
    const fecha_nacimiento = obtenerFechaNac(curp);

    const query = `
      INSERT INTO cliente (
        folio_cliente, nombre_cliente, app_cliente, apm_cliente, curp,
        rfc, fecha_nacimiento, nacionalidad, direccion_id, ocupacion,
        ciclo_actual, telefono
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id_cliente
    `;

    const result = await client.query(query, [
      folio_cliente,
      nombre_cliente,
      app_cliente,
      apm_cliente,
      curp?.toUpperCase() || null,
      rfc?.toUpperCase() || null,
      fecha_nacimiento || null,
      nacionalidad,
      direccion_id,
      ocupacion,
      ciclo_actual,
      telefono
    ]);

    res.status(201).json({
      message: 'Cliente guardado exitosamente',
      id_cliente: result.rows[0].id_cliente
    });

  } catch (error) {
    console.error('Error al guardar cliente:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};


// Mantener las otras funciones igual...
const mostrarClientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id_cliente, c.folio_cliente, c.nombre_cliente, 
             c.app_cliente, c.apm_cliente, c.telefono, c.curp, 
             c.rfc, c.fecha_nacimiento, c.nacionalidad, 
             c.ocupacion, c.ciclo_actual,
             d.municipio, d.localidad, d.calle, d.numero
      FROM cliente c
      LEFT JOIN direccion d ON c.direccion_id = d.id_direccion
      ORDER BY c.id_cliente ASC;
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener clientes', error: error.message })
  }
};


const mostrarCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT c.id_cliente, c.folio_cliente, c.nombre_cliente, 
             c.app_cliente, c.apm_cliente, c.telefono, c.curp,
             c.rfc, c.fecha_nacimiento, c.nacionalidad,
             c.ocupacion, c.ciclo_actual,
             d.municipio, d.localidad, d.calle, d.numero
      FROM cliente c
      LEFT JOIN direccion d ON c.direccion_id = d.id_direccion
      WHERE c.id_cliente = $1;
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cliente', error: error.message })
  }
};


const editarCliente = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      id_cliente,
      folio_cliente,
      nombre_cliente,
      app_cliente,
      apm_cliente,
      telefono,
      curp,
      rfc,
      fecha_nacimiento,
      nacionalidad,
      ocupacion,
      ciclo_actual,
      municipio,
      localidad,
      calle,
      numero
    } = req.body;

    if (!id_cliente) {
      return res.status(400).json({ message: 'Falta el ID del cliente' });
    }

    await client.query('BEGIN');

    const dirQuery = await client.query(
      `SELECT direccion_id FROM cliente WHERE id_cliente = $1`,
      [id_cliente]
    );

    if (dirQuery.rowCount === 0) {
      throw new Error('Cliente no encontrado');
    }

    const idDireccion = dirQuery.rows[0].direccion_id;

    await client.query(
      `UPDATE cliente
       SET folio_cliente=$1,
           nombre_cliente=$2,
           app_cliente=$3,
           apm_cliente=$4,
           telefono=$5,
           curp=$6,
           rfc=$7,
           fecha_nacimiento=$8,
           nacionalidad=$9,
           ocupacion=$10,
           ciclo_actual=$11
       WHERE id_cliente = $12`,
      [
        folio_cliente,
        nombre_cliente,
        app_cliente,
        apm_cliente,
        telefono,
        curp,
        rfc,
        fecha_nacimiento,
        nacionalidad,
        ocupacion,
        ciclo_actual,
        id_cliente
      ]
    );

    await client.query(
      `UPDATE direccion
       SET municipio=$1,
           localidad=$2,
           calle=$3,
           numero=$4
       WHERE id_direccion=$5`,
      [municipio, localidad, calle, numero, idDireccion]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Cliente actualizado correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Error al editar cliente', error: error.message });
  } finally {
    client.release();
  }
};


const eliminarCliente = async (req, res) => {
  const client = await pool.connect();
  try {
    const id_cliente = req.params.id;

    await client.query('BEGIN');

    // 1. Eliminar solicitudes asociadas a cliente
    await client.query(`DELETE FROM solicitud WHERE cliente_id = $1`, [id_cliente]);
    // 2. Obtener id direccion para eliminar 
    const dirResult = await client.query(
      `SELECT direccion_id FROM cliente WHERE id_cliente = $1`, [id_cliente]
    );
    if (dirResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cliente no encontrado' });
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
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error al eliminar cliente: ', error);
    res.status(200).json({ message: 'Error al eliminar cliente', error });
  } finally {
    client.release();
  }
}

const obtenerClientesPorAliado = async (req, res) => {
  const { id_aliado } = req.params;

  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        c.id_cliente, c.folio_cliente, c.nombre_cliente, 
        c.app_cliente, c.apm_cliente, c.telefono, c.curp,
        c.rfc, c.fecha_nacimiento, c.nacionalidad,
        c.ocupacion, c.ciclo_actual,
        d.municipio, d.localidad, d.calle, d.numero
      FROM cliente c
      INNER JOIN solicitud s ON s.cliente_id = c.id_cliente
      INNER JOIN credito cr ON cr.solicitud_id = s.id_solicitud
      LEFT JOIN direccion d ON c.direccion_id = d.id_direccion
      WHERE cr.aliado_id = $1;
    `, [id_aliado]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No hay clientes para este aliado" });
    }

    res.status(200).json(result.rows);

  } catch (error) {
    res.status(500).json({ 
      message: "Error al obtener clientes por aliado", 
      error: error.message 
    });
  }
};



module.exports = {
  guardarDireccion,
  guardarCliente,
  editarCliente,
  eliminarCliente,
  mostrarClientes,
  mostrarCliente,
  obtenerClientesPorAliado
};