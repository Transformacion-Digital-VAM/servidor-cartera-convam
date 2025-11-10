const pool = require('../config/db');

const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuario');
    res.json({
      success: true,
      message: 'Usuarios obtenidos correctamente',
      data: {
        users: result.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message 
    });
  }
};

// Eliminar usuario
const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM usuario WHERE id_usuario = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message 
    });
  }
};

module.exports = { getUsuarios, deleteUsuario };