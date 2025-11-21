const express = require('express');
const cors = require('cors'); // 👈 importa cors
const pool = require('./src/config/db'); 
const usuarioRoutes = require('./src/routes/usuario.routes');
const rolRoutes = require('./src/routes/rol.routes');
const authRoutes = require('./src/routes/auth.routes');
const clienteRoutes = require('./src/routes/cliente.routes');
const solicitudRoutes = require('./src/routes/solicitud.routes');
const creditoRoutes = require('./src/routes/credito.routes');
const app = express();

// Habilitar CORS para permitir solicitudes desde Angular
app.use(cors({
  origin: 'http://localhost:4200', //  URL del frontend Angular
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Conexión exitosa', time: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la conexión' });
  }
});

// Rutas
app.use('/usuario', usuarioRoutes);
app.use('/rol', rolRoutes);
app.use('/auth', authRoutes);
app.use('/cliente', clienteRoutes);
app.use('/solicitud', solicitudRoutes);
app.use('/credito', creditoRoutes);


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


