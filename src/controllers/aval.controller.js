const pool = require('../config/db');

const guardarAval = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
        nombre_aval,
        app_aval,
        apm_aval,
        curp,
        direccion_id,
        cliente_id,        
    } = req.body;

    // Validad direccion

    const direccionExistente = await client.query(
        `SELECT id_direccion FROM direccion WHERE id_direccion = $1`,
        [direccion_id]
    );

    if (direccionExistente.rows.length === 0) {
      return res.status(400).json({
        error: 'Dirección no encontrada',
        message: 'La dirección especificada no existe'
      });
    }

    const clienteExistente = await client.query(
      'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
      [cliente_id]
    );

    if (clienteExistente.rows.length === 0) {
      return res.status(400).json({
        error: 'Cliente no encontrado',
        message: 'El cliente especificado no existe'
      });
    }

    const avalQuery = `
      INSERT INTO aval (
        nombre_aval, app_aval, apm_aval, curp, 
        direccion_id, cliente_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_aval
    `;

    const avalResult = await client.query(avalQuery, [
      nombre_aval,
      app_aval,
      apm_aval,
      curp,
      direccion_id,
      cliente_id
    ]);

    res.status(201).json({
      message: 'Aval guardado exitosamente',
      id_aval: avalResult.rows[0].id_aval
    });

  } catch (error) {
    console.error('Error al guardar aval:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
}

const obtenerAvalesPorCliente = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id } = req.params;

    const query = `
      SELECT a.*, d.*
      FROM aval a
      LEFT JOIN direccion d ON a.direccion_id = d.id_direccion
      WHERE a.cliente_id = $1
    `;

    const result = await client.query(query, [cliente_id]);

    res.status(200).json({
      message: 'Avales obtenidos correctamente',
      avales: result.rows
    });

  } catch (error) {
    console.error('Error al obtener avales:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};


const editarAval = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_aval } = req.params;

    const {
      nombre_aval,
      app_aval,
      apm_aval,
      curp,
      direccion_id,
      cliente_id
    } = req.body;

    // Validar que el aval existe
    const avalExistente = await client.query(
      'SELECT id_aval FROM aval WHERE id_aval = $1',
      [id_aval]
    );

    if (avalExistente.rows.length === 0) {
      return res.status(404).json({
        error: 'Aval no encontrado'
      });
    }

    // Validar dirección si viene
    if (direccion_id) {
      const direccion = await client.query(
        'SELECT id_direccion FROM direccion WHERE id_direccion = $1',
        [direccion_id]
      );

      if (direccion.rows.length === 0) {
        return res.status(400).json({
          error: 'Dirección no encontrada'
        });
      }
    }

    // Validar cliente si viene
    if (cliente_id) {
      const cliente = await client.query(
        'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
        [cliente_id]
      );

      if (cliente.rows.length === 0) {
        return res.status(400).json({
          error: 'Cliente no encontrado'
        });
      }
    }

    const updateQuery = `
      UPDATE aval SET
        nombre_aval = COALESCE($1, nombre_aval),
        app_aval = COALESCE($2, app_aval),
        apm_aval = COALESCE($3, apm_aval),
        curp = COALESCE($4, curp),
        direccion_id = COALESCE($5, direccion_id),
        cliente_id = COALESCE($6, cliente_id)
      WHERE id_aval = $7
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      nombre_aval,
      app_aval,
      apm_aval,
      curp ? curp.toUpperCase() : null,
      direccion_id,
      cliente_id,
      id_aval
    ]);

    res.status(200).json({
      message: 'Aval actualizado correctamente',
      aval: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar aval:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

const eliminarAval = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id_aval } = req.params;

    const avalExistente = await client.query(
      'SELECT id_aval FROM aval WHERE id_aval = $1',
      [id_aval]
    );

    if (avalExistente.rows.length === 0) {
      return res.status(404).json({
        error: 'Aval no encontrado'
      });
    }

    // Intento de eliminar
    await client.query('DELETE FROM aval WHERE id_aval = $1', [id_aval]);

    res.status(200).json({
      message: 'Aval eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar aval:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No se puede eliminar el aval porque está relacionado con otros registros.'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};


const listarAvales = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = `
      SELECT a.*, d.*
      FROM aval a
      LEFT JOIN direccion d ON a.direccion_id = d.id_direccion
      ORDER BY a.id_aval ASC
    `;

    const result = await client.query(query);

    res.status(200).json({
      message: 'Avales obtenidos correctamente',
      avales: result.rows
    });

  } catch (error) {
    console.error('Error al listar avales:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  } finally {
    client.release();
  }
};


module.exports = {
  guardarAval,
  obtenerAvalesPorCliente,
  editarAval,
  eliminarAval,
  listarAvales
};