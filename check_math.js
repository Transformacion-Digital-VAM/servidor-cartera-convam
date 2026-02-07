const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT id_credito, total_capital, total_a_pagar, saldo_pendiente 
            FROM credito 
            WHERE estado_credito::text NOT IN ('CANCELADO', 'LIQUIDADO') 
            LIMIT 1
        `);
        console.log('Sample:', res.rows[0]);

        const id = res.rows[0].id_credito;
        const res2 = await pool.query(`
            SELECT SUM(capital_pagado) as cp, SUM(total_pago) as tp 
            FROM pago 
            WHERE credito_id = $1
        `, [id]);
        console.log('Payments for', id, ':', res2.rows[0]);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
