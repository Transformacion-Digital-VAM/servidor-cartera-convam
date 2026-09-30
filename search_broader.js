const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function search() {
    try {
        const res = await pool.query(`
            SELECT cl.id_cliente, cl.nombre_cliente, cl.app_cliente, s.id_solicitud, c.id_credito, c.estado_credito, c.saldo_pendiente
            FROM cliente cl
            LEFT JOIN solicitud s ON cl.id_cliente = s.cliente_id
            LEFT JOIN credito c ON s.id_solicitud = c.solicitud_id
            WHERE cl.nombre_cliente ILIKE '%CAROLINA%' OR cl.app_cliente ILIKE '%VARGAS%'
        `);
        console.log(res.rows.map(r => `${r.id_cliente}: ${r.nombre_cliente} ${r.app_cliente} | SOL:${r.id_solicitud} | CRED:${r.id_credito} (${r.estado_credito}) $${r.saldo_pendiente}`).join('\n'));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

search();
