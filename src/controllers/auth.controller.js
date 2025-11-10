// maaaaricrc@gmail.com

const admin = require('../config/firebase.js');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  const { nombre, usuario, contrasenia, rol_id, firebase_uid } = req.body;

  console.log('Datos recibidos en backend:', req.body);

  if (!firebase_uid || !usuario || !nombre || !contrasenia) {
    return res.status(400).json({ 
      success: false,
      message: 'Faltan datos obligatorios: nombre, usuario, contrasenia, firebase_uid' 
    });
  }

  try {
    // 1Verificar si ya existe en la base de datos
    const userExists = await pool.query(
      'SELECT * FROM usuario WHERE firebase_uid = $1 OR usuario = $2',
      [firebase_uid, usuario]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'El usuario ya está registrado' 
      });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    // Insertar el nuevo usuario
    const newUser = await pool.query(
      `INSERT INTO usuario (nombre, usuario, contrasenia, rol_id, firebase_uid)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, usuario, hashedPassword, rol_id || 3, firebase_uid] // rol_id por defecto 3 (Consulta)
    );

    console.log('Usuario insertado correctamente en PostgreSQL:', newUser.rows[0]);

    // Remover la contraseña del response por seguridad
    const userResponse = { ...newUser.rows[0] };
    delete userResponse.contrasenia;

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Error registrando usuario en PostgreSQL:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al registrar usuario' 
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    console.log('Token Firebase verificado para:', email, decodedToken);

    // Buscar si el usuario ya existe
    const userResult = await pool.query(
      'SELECT * FROM usuario WHERE firebase_uid = $1 OR usuario = $2',
      [uid, email]
    );

    let dbUser = userResult.rows[0];

    if (!dbUser) {
      // 🔹 Si no existe, crearlo con valores por defecto
      const insertResult = await pool.query(
        `INSERT INTO usuario (nombre, usuario, rol_id, firebase_uid, contrasenia)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name || 'Sin nombre', email, 3, uid, await bcrypt.hash('DEFAULT_PASSWORD', 10)]
      );
      dbUser = insertResult.rows[0];
      console.log('Usuario creado automáticamente en PostgreSQL:', dbUser.usuario);
    }

    // Remover contraseña del response
    const userResponse = { ...dbUser };
    delete userResponse.contrasenia;

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Error en loginUser:', error);
    res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
};

module.exports = {
  registerUser,
  loginUser
};