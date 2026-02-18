// // const { Pool } = require('pg');
// // require('dotenv').config();

// // const pool = new Pool({
// //   connectionString: process.env.DATABASE_URL,
// //   ssl: process.env.NODE_ENV === 'production'
// //     ? { rejectUnauthorized: false }
// //     : false,
// // });

// // pool.on('connect', () => {
// //   console.log('Conectado a PostgreSQL');
// // });

// // pool.on('error', (err) => {
// //   console.error('Error inesperado en PostgreSQL', err);
// //   process.exit(1);
// // });

// // module.exports = pool;



const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Requerido para Neon DB y Render
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL (Neon DB)');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL', err);
  process.exit(1);
});

module.exports = pool;


// const { Pool } = require('pg');
// require('dotenv').config();

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL_RENDER || process.env.DATABASE_URL,
//   ssl: (process.env.DATABASE_URL_RENDER || process.env.NODE_ENV === 'production')
//     ? { rejectUnauthorized: false }
//     : false,
// });

// pool.on('connect', () => {
//   console.log('Conectado a PostgreSQL');
// });

// pool.on('error', (err) => {
//   console.error('Error inesperado en PostgreSQL', err);
//   process.exit(1);
// });

// module.exports = pool;