const admin = require('../config/firebase.js');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Agregar la info del usuario a la request
    req.user = {
      firebase_uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };

    // Opcional: Obtener más datos de tu base de datos
    const pool = require('../config/db');
    const userResult = await pool.query(
      'SELECT id_usuario, nombre, usuario, rol_id FROM usuario WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (userResult.rows.length > 0) {
      req.user.id_usuario = userResult.rows[0].id_usuario;
      req.user.rol_id = userResult.rows[0].rol_id;
      req.user.nombre = userResult.rows[0].nombre;
      
    }

    next();
  } catch (error) {
    console.error('Error verificando token Firebase:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

module.exports = verifyFirebaseToken;