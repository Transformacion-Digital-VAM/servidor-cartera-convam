const pool = require('../config/db');


const getRol = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rol');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

module.exports = { getRol };
