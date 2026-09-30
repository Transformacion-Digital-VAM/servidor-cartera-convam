const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function findCarolina() {
    try {
        const res = await pool.query(`
            SELECT cl.id_cliente, cl.nombre_cliente, cl.app_cliente, c.id_credito, c.estado_credito, c.saldo_pendiente, s.aliado_id
            FROM cliente cl
            JOIN solicitud s ON cl.id_cliente = s.cliente_id
            JOIN credito c ON s.id_solicitud = c.solicitud_id
            WHERE cl.nombre_cliente ILIKE '%CAROLINA%'
        `);
        console.log(res.rows.map(r => `${r.id_cliente}: ${r.nombre_cliente} ${r.app_cliente} | ALIADO:${r.aliado_id} | CRED:${r.id_credito} (${r.estado_credito}) $${r.saldo_pendiente}`).join('\n'));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findCarolina();
