const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:admin@localhost:5432/cartera_convam'
});

async function testV3Query() {
    const months = 6;
    const portfolioQuery = `
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', CURRENT_DATE - INTERVAL '${months} months'),
                    date_trunc('month', CURRENT_DATE),
                    '1 month'
                )::date as mes_inicio
            ),
            monthly_disbursements AS (
                SELECT 
                    date_trunc('month', fecha_ministracion)::date as mes,
                    SUM(total_a_pagar) as total_disbursed
                FROM credito
                WHERE estado_credito::text != 'CANCELADO'
                GROUP BY 1
            ),
            monthly_payments AS (
                SELECT 
                    date_trunc('month', fecha_operacion)::date as mes,
                    SUM(total_pago) as total_paid
                FROM pago
                GROUP BY 1
            ),
            snapshots AS (
                SELECT 
                    m.mes_inicio,
                    (SELECT COALESCE(SUM(total_disbursed), 0) FROM monthly_disbursements WHERE mes <= m.mes_inicio) -
                    (SELECT COALESCE(SUM(total_paid), 0) FROM monthly_payments WHERE mes <= m.mes_inicio) as cartera_total,
                    (
                        SELECT COALESCE(SUM(
                            CASE 
                                WHEN (SELECT MAX(fecha_vencimiento) FROM calendario_pago cp2 WHERE cp2.pagare_id = pagare.id_pagare) + INTERVAL '7 days' < (m.mes_inicio + INTERVAL '1 month')
                                THEN (
                                    SELECT SUM(total_semana - monto_pagado) 
                                    FROM calendario_pago cp3 
                                    WHERE cp3.pagare_id = pagare.id_pagare 
                                    AND cp3.fecha_vencimiento < (m.mes_inicio + INTERVAL '1 month')
                                )
                                ELSE (
                                    SELECT SUM(total_semana - monto_pagado) 
                                    FROM calendario_pago cp3 
                                    WHERE cp3.pagare_id = pagare.id_pagare 
                                    AND cp3.fecha_vencimiento < (CASE WHEN m.mes_inicio = date_trunc('month', CURRENT_DATE) THEN CURRENT_DATE ELSE m.mes_inicio + INTERVAL '1 month' END)
                                )
                            END
                        ), 0)
                        FROM pagare
                        INNER JOIN credito c ON pagare.credito_id = c.id_credito
                        WHERE c.estado_credito::text NOT IN ('CANCELADO', 'LIQUIDADO', 'FINALIZADO')
                        AND c.fecha_ministracion < (m.mes_inicio + INTERVAL '1 month')
                    ) as mora
                FROM months m
            )
            SELECT 
                TO_CHAR(mes_inicio, 'YYYY-MM') as mes,
                cartera_total,
                mora
            FROM snapshots
            ORDER BY 1
    `;

    try {
        const res = await pool.query(portfolioQuery);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

testV3Query();
