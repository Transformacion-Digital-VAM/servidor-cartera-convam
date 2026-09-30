const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkFinalizados() {
    try {
        const res = await pool.query(`
            SELECT id_credito, cl.nombre_cliente, cl.app_cliente, saldo_pendiente, estado_credito
            FROM credito c
            JOIN solicitud s ON c.solicitud_id = s.id_solicitud
            JOIN cliente cl ON s.cliente_id = cl.id_cliente
            WHERE estado_credito = 'FINALIZADO'
        `);
        console.log(res.rows.map(r => `${r.id_credito}: ${r.nombre_cliente} ${r.app_cliente} ($${r.saldo_pendiente})`).join('\n'));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkFinalizados();
