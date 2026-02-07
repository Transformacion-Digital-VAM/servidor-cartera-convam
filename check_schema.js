const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function checkSchema() {
    try {
        console.log('--- DATA SCHEMA ---');

        const creditoCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'credito'
        `);
        console.log('Credito Columns:', creditoCols.rows.map(c => c.column_name).join(', '));

        const sample = await pool.query(`
            SELECT total_capital, total_interes, total_a_pagar, saldo_pendiente 
            FROM credito 
            WHERE estado_credito NOT IN ('CANCELADO', 'LIQUIDADO') 
            LIMIT 5
        `);
        console.log('Sample Credito Data:');
        console.table(sample.rows);

        const totals = await pool.query(`
            SELECT 
                SUM(total_capital) as sum_capital,
                SUM(total_interes) as sum_interes,
                SUM(total_a_pagar) as sum_total_pagar,
                SUM(saldo_pendiente) as sum_saldo_pendiente
            FROM credito 
            WHERE estado_credito NOT IN ('CANCELADO', 'LIQUIDADO', 'FINALIZADO')
        `);
        console.log('Global Totals:');
        console.table(totals.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
