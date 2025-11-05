const express = require('express');
const pool = require('./src/config/db'); 
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Ruta de prueba para validar conexión a la base de datos
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Conexión exitosa', time: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la conexión' });
  }
});

app.use('/', require('./src/routes/auth.routes'))

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
