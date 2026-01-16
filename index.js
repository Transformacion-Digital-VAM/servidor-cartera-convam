const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');
const usuarioRoutes = require('./src/routes/usuario.routes');
const rolRoutes = require('./src/routes/rol.routes');
const authRoutes = require('./src/routes/auth.routes');
const clienteRoutes = require('./src/routes/cliente.routes');
const solicitudRoutes = require('./src/routes/solicitud.routes');
const creditoRoutes = require('./src/routes/credito.routes');
const aliadoRoutes = require('./src/routes/aliado.routes');
const pagareRoutes = require('./src/routes/pagare.routes');
const pagoRoutes = require('./src/routes/pago.routes');
const reporteRoutes = require('./src/routes/reporte.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const admin = require('./src/config/firebase.js');
const app = express();


// Habilitar CORS para permitir solicitudes desde Angular
app.use(cors({
  origin: 'https://convam-cartera.web.app', //  URL del frontend Angular
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/usuario', usuarioRoutes);
app.use('/rol', rolRoutes);
app.use('/auth', authRoutes);
app.use('/cliente', clienteRoutes);
app.use('/solicitud', solicitudRoutes);
app.use('/credito', creditoRoutes);
app.use('/aliado', aliadoRoutes);
app.use('/pagare', pagareRoutes);
app.use('/pago', pagoRoutes);
app.use('/reporte', reporteRoutes);
app.use('/dashboard', dashboardRoutes);

admin.auth().listUsers(1)
  .then(() => console.log('🔥 Firebase Admin conectado correctamente'))
  .catch(err => console.error('❌ Firebase Admin ERROR:', err));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


