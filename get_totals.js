const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function getTotals() {
    try {
        const res2 = await pool.query(`
            SELECT 
                SUM(c.total_capital) as capital_only,
                SUM(c.total_a_pagar) as total_including_interest
            FROM credito c
            WHERE c.estado_credito::text NOT IN ('CANCELADO', 'LIQUIDADO', 'FINALIZADO')
        `);
        console.log('COMPARISON:', res2.rows[0]);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

getTotals();
