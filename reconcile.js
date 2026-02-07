const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function verifyCalculations() {
    try {
        const reconQuery = `
            SELECT 
                (SELECT SUM(total_a_pagar) FROM credito WHERE estado_credito::text != 'CANCELADO') as total_invested,
                (SELECT SUM(capital_pagado + interes_pagado) FROM pago) as total_payments_received,
                (SELECT SUM(saldo_pendiente) FROM credito WHERE estado_credito::text IN ('ENTREGADO', 'PENDIENTE', 'DEVOLUCION', 'VENCIDO')) as current_balance
        `;
        const reconRes = await pool.query(reconQuery);
        console.log('Results:', reconRes.rows[0]);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

verifyCalculations();
