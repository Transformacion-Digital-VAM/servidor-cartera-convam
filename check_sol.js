const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkSol() {
    try {
        const res = await pool.query(`
            SELECT s.id_solicitud, s.estado, c.id_credito, c.estado_credito, c.saldo_pendiente
            FROM solicitud s
            LEFT JOIN credito c ON s.id_solicitud = c.solicitud_id
            JOIN cliente cl ON s.cliente_id = cl.id_cliente
            WHERE cl.nombre_cliente ILIKE '%CAROLINA%' AND cl.app_cliente ILIKE '%VARGAS%'
        `);
        console.log(res.rows.map(r => `${r.id_solicitud} [SOL:${r.estado}] [CRED:${r.id_credito}:${r.estado_credito}:${r.saldo_pendiente}]`).join('\n'));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSol();
