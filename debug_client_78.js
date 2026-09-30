const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function debugCredit() {
    try {
        const res = await pool.query(`
            SELECT 
                c.id_credito, 
                c.estado_credito, 
                c.saldo_pendiente, 
                cl.nombre_cliente, 
                cl.app_cliente,
                (SELECT MAX(fecha_vencimiento) FROM calendario_pago cp JOIN pagare p ON cp.pagare_id = p.id_pagare WHERE p.credito_id = c.id_credito) as last_vencimiento
            FROM credito c
            INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
            INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
            WHERE cl.nombre_cliente ILIKE '%CAROLINA%' AND cl.app_cliente ILIKE '%VARGAS%'
        `);

        const output = {
            creditos: res.rows
        };

        fs.writeFileSync('debug_results.json', JSON.stringify(output, null, 2));
        console.log('Results written to debug_results.json');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debugCredit();
