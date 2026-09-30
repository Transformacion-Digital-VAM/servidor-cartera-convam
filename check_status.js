const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkStatus() {
    try {
        const res = await pool.query(`SELECT DISTINCT estado_credito FROM credito`);
        res.rows.forEach(r => console.log(r.estado_credito));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkStatus();
