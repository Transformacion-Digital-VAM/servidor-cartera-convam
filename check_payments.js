const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function checkHiddenPayments() {
    try {
        const res = await pool.query(`
            SELECT 
                SUM(monto_pagado) as total_en_calendario,
                (SELECT SUM(total_pago) FROM pago) as total_en_pago
            FROM calendario_pago
        `);
        console.log('Payments reconciliation:', res.rows[0]);

        const res2 = await pool.query(`
            SELECT 
                SUM(total_a_pagar) as total_invested_active,
                SUM(saldo_pendiente) as total_saldo_active,
                SUM(total_a_pagar - saldo_pendiente) as calculated_paid_active
            FROM credito 
            WHERE estado_credito::text IN ('ENTREGADO', 'PENDIENTE', 'DEVOLUCION', 'VENCIDO')
        `);
        console.log('Active credits stats:', res2.rows[0]);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkHiddenPayments();
