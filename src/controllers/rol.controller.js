const pool = require('../config/db');

const getRol = async (req, res) => {
  try {
    console.log('📋 Solicitando lista de roles...');

    const result = await pool.query('SELECT * FROM rol ORDER BY id_rol');

    console.log(`✅ ${result.rows.length} roles encontrados`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener roles de la base de datos',
      details: error.message
    });
  }
};

// Opcional: Obtener rol por ID
const getRolById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM rol WHERE id_rol = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el rol'
    });
  }
};

module.exports = {
  getRol,
  getRolById
};