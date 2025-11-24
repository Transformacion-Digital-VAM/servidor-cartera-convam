const pool = require('../config/db');

const obtenerAliados = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM aliado ORDER BY id_aliado ASC`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener aliados:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
}

const obtenerAliadoPorId = async (req, res) => {
    try {
        const { id_aliado } = req.params;
        const result = await pool.query(`SELECT * FROM aliado WHERE id_aliado = $1`, [id_aliado]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener aliado por ID:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
}

const guardarAliado = async (req, res) => {
    try {
        const { nom_aliado, tasa_interes } = req.body;
        if (!nom_aliado || !tasa_interes) {
            return res.status(400).json({
                error: 'Faltan datos',
                message: 'Se requieren el nombre del aliado y la tasa de interés'
            });
        }

    const result = await pool.query(`INSERT INTO aliado (nom_aliado, tasa_interes) VALUES ($1, $2) RETURNING *`, [nom_aliado, tasa_interes]);
    res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al guardar aliado:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
}

const editarAliado = async (req, res) => {
    try {
        const { id_aliado } = req.params;
        const { nom_aliado, tasa_interes } = req.body;
        if (!nom_aliado || !tasa_interes) {
            return res.status(400).json({
                error: 'Faltan datos',
                message: 'Se requieren el nombre del aliado y la tasa de interés'
            });
        }

    const result = await pool.query(`UPDATE aliado SET nom_aliado = $1, tasa_interes = $2 WHERE id_aliado = $3 RETURNING *`, [nom_aliado, tasa_interes, id_aliado]);
    res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al editar aliado:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
}

const eliminarAliado = async (req, res) => {
    try {
        const { id_aliado } = req.params;
        const result = await pool.query(`DELETE FROM aliado WHERE id_aliado = $1 RETURNING *`, [id_aliado]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al eliminar aliado:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
}


module.exports = {
  obtenerAliados,
  obtenerAliadoPorId,
  guardarAliado,
  editarAliado,
  eliminarAliado
};
