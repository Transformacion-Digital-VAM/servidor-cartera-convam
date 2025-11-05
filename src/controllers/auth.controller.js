const admin = require('../config/firebase.js');
const  { db }  = require('../config/db.js');
const pool = require('../config/db');

// SOLO PRUEBAS 
 const registerUser = async (req, res) => {
  const { nombre, usuario, contrasenia, rol_id, firebase_uid } = req.body;

  if (!firebase_uid || !usuario || !nombre) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    // 1. Verificar si ya existe en la base de datos
    const userExists = await pool.query(
      'SELECT * FROM usuario WHERE firebase_uid = $1 OR usuario = $2',
      [firebase_uid, usuario]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'El usuario ya está registrado' });
    }

    // 2. Insertar el nuevo usuario
    const newUser = await pool.query(
      `INSERT INTO usuario (nombre, usuario, contrasenia, rol_id, firebase_uid)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, usuario, contrasenia, rol_id || 1, firebase_uid] // 2 = ejemplo de rol "ejecutiva"
    );

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('Error registrando usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};


const loginUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token no enviado' });

    // 1. Verificar token Firebase
    const decoded = await admin.auth().verifyIdToken(token);

    // 2. Buscar usuario en PostgreSQL
    let user = await pool.query(
      'SELECT * FROM usuario WHERE firebase_uid = $1',
      [decoded.uid]
    );

    // 3. Si no existe → insertarlo
    if (user.rows.length === 0) {
      await pool.query(
        `INSERT INTO usuario (nombre, usuario, rol_id, contrasenia, firebase_uid)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          decoded.name || 'Sin nombre',
          decoded.email,
          2,
          null,
          decoded.uid
        ]
      );

      user = await pool.query(
        'SELECT * FROM usuario WHERE firebase_uid = $1',
        [decoded.uid]
      );
    }

    res.json({
      message: '✅ Login correcto',
      user: user.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({ error: '❌ Token inválido o expirado' });
  }
};

module.exports ={
  registerUser,
  loginUser
}