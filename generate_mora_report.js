const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function generateReport() {
    try {
        // 1. Obtener Cartera Vencida (Saldo Total)
        const vencidosQuery = `
      SELECT 
          c.id_credito,
          cl.nombre_cliente || ' ' || cl.app_cliente AS cliente,
          c.saldo_pendiente as monto_mora,
          'CARTERA VENCIDA (Fuera de ciclo)' as tipo
      FROM credito c
      INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
      INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
      INNER JOIN pagare p ON c.id_credito = p.credito_id
      WHERE (c.estado_credito = 'VENCIDO' 
         OR (SELECT MAX(fecha_vencimiento) FROM calendario_pago WHERE pagare_id = p.id_pagare) + INTERVAL '7 days' < CURRENT_DATE)
         AND c.saldo_pendiente > 0;
    `;

        // 2. Obtener Mora Corriente (Solo atrasos de dentro de ciclo)
        const corrienteQuery = `
      WITH info AS (
          SELECT 
              c.id_credito,
              cl.nombre_cliente || ' ' || cl.app_cliente AS cliente,
              (SELECT MAX(fecha_vencimiento) FROM calendario_pago cp2 WHERE cp2.pagare_id = p.id_pagare) as fecha_termino
          FROM credito c
          INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
          INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
          INNER JOIN pagare p ON c.id_credito = p.credito_id
          WHERE c.estado_credito != 'VENCIDO'
            AND (SELECT MAX(fecha_vencimiento) FROM calendario_pago cp3 WHERE cp3.pagare_id = p.id_pagare) + INTERVAL '7 days' >= CURRENT_DATE
      )
      SELECT 
          i.id_credito,
          i.cliente,
          SUM(cp.total_semana - cp.monto_pagado) as monto_mora,
          'MORA CORRIENTE (Atrasos en ciclo)' as tipo
      FROM info i
      INNER JOIN pagare p ON i.id_credito = p.credito_id
      INNER JOIN calendario_pago cp ON p.id_pagare = cp.pagare_id
      WHERE cp.pagado = false AND cp.fecha_vencimiento < CURRENT_DATE
      GROUP BY i.id_credito, i.cliente
      HAVING SUM(cp.total_semana - cp.monto_pagado) > 0;
    `;

        const resVencidos = await pool.query(vencidosQuery);
        const resCorriente = await pool.query(corrienteQuery);

        const allRecords = [...resVencidos.rows, ...resCorriente.rows];

        // Formatear archivo
        let fileContent = 'LISTADO DE CLIENTES EN MORA - CARTERA CONVAM\n';
        fileContent += `Fecha de generación: ${new Date().toLocaleString()}\n`;
        fileContent += '------------------------------------------------------------------------------------------------\n';
        fileContent += 'ID  | CLIENTE                      | MONTO MORA | TIPO DE MORA\n';
        fileContent += '------------------------------------------------------------------------------------------------\n';

        allRecords.forEach(r => {
            fileContent += `${r.id_credito.toString().padEnd(3)} | ${r.cliente.substring(0, 28).padEnd(28)} | $${parseFloat(r.monto_mora).toFixed(2).padStart(10)} | ${r.tipo}\n`;
        });

        fileContent += '------------------------------------------------------------------------------------------------\n';
        const totalMora = allRecords.reduce((acc, r) => acc + parseFloat(r.monto_mora), 0);
        fileContent += `TOTAL MORA: $${totalMora.toFixed(2)}\n`;
        fileContent += `TOTAL CLIENTES/CRÉDITOS: ${allRecords.length}\n`;

        const filePath = path.join(__dirname, 'LISTADO_MORA_CLIENTES.txt');
        fs.writeFileSync(filePath, fileContent);

        console.log(`Reporte generado exitosamente en: ${filePath}`);

    } catch (err) {
        console.error('Error generando reporte:', err);
    } finally {
        await pool.end();
    }
}

generateReport();
