const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function checkPagoSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'pago'
        `);
        console.log('Pago Columns:', res.rows.map(c => c.column_name).join(', '));

        const resSample = await pool.query(`SELECT * FROM pago LIMIT 3`);
        console.log('Pago Sample:');
        console.table(resSample.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkPagoSchema();
