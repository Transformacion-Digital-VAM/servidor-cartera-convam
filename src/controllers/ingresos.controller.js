const pool = require('../config/db');

const obtenerIngresos = async (req, res) => {
    const client = await pool.connect();
    try {
        const { fecha_inicio, fecha_fin, periodo, cliente: filtroCliente, aliado: filtroAliado, aliados: filtroAliados } = req.query;

        // Solo registros con pago confirmado
        let conditions = ['p.pago_registrado IS NOT NULL'];
        let params = [];
        let paramIndex = 1;

        // ── Filtro por rango de fechas explícito ──────────────────────────────
        if (fecha_inicio) {
            conditions.push(`p.fecha_operacion::date >= $${paramIndex}::date`);
            params.push(fecha_inicio);
            paramIndex++;
        }

        if (fecha_fin) {
            conditions.push(`p.fecha_operacion::date <= $${paramIndex}::date`);
            params.push(fecha_fin);
            paramIndex++;
        }

        // ── Filtro por período relativo (solo si no hay fechas explícitas) ────
        if (!fecha_inicio && !fecha_fin && periodo) {
            const p = periodo.toLowerCase();
            if (p === 'semana') {
                conditions.push(`p.fecha_operacion::date >= date_trunc('week', CURRENT_DATE)::date`);
                conditions.push(`p.fecha_operacion::date < (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')::date`);
            } else if (p === 'quincena') {
                conditions.push(`
                    (
                        (EXTRACT(DAY FROM CURRENT_DATE) <= 15
                            AND p.fecha_operacion::date >= date_trunc('month', CURRENT_DATE)::date
                            AND p.fecha_operacion::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '15 days')::date)
                        OR
                        (EXTRACT(DAY FROM CURRENT_DATE) > 15
                            AND p.fecha_operacion::date >= (date_trunc('month', CURRENT_DATE) + INTERVAL '15 days')::date
                            AND p.fecha_operacion::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date)
                    )
                `);
            } else if (p === 'mes') {
                conditions.push(`p.fecha_operacion::date >= date_trunc('month', CURRENT_DATE)::date`);
                conditions.push(`p.fecha_operacion::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date`);
            } else if (p === 'hoy') {
                conditions.push(`p.fecha_operacion::date = CURRENT_DATE`);
            }
        }

        // ── Filtro por nombre de cliente ──────────────────────────────────────
        if (filtroCliente && filtroCliente.trim()) {
            conditions.push(`LOWER(CONCAT(cli.nombre_cliente, ' ', cli.app_cliente, ' ', COALESCE(cli.apm_cliente, ''))) LIKE LOWER($${paramIndex})`);
            params.push(`%${filtroCliente.trim()}%`);
            paramIndex++;
        }

        // ── Filtro por aliado (simple, legado) ───────────────────────────────
        if (filtroAliado && filtroAliado.trim() && !filtroAliados) {
            conditions.push(`(LOWER(a.nom_aliado) LIKE LOWER($${paramIndex}) OR c.aliado_id::text = $${paramIndex})`);
            params.push(`%${filtroAliado.trim()}%`);
            paramIndex++;
        }

        // ── Filtro por múltiples aliados (multiselect) ────────────────────────
        if (filtroAliados && filtroAliados.trim()) {
            const listaAliados = filtroAliados.split(',').map(a => a.trim()).filter(a => a.length > 0);
            if (listaAliados.length === 1) {
                conditions.push(`LOWER(TRIM(a.nom_aliado)) = LOWER($${paramIndex})`);
                params.push(listaAliados[0]);
                paramIndex++;
            } else if (listaAliados.length > 1) {
                const inPlaceholders = listaAliados.map((_, i) => `LOWER($${paramIndex + i})`).join(', ');
                conditions.push(`LOWER(TRIM(a.nom_aliado)) IN (${inPlaceholders})`);
                listaAliados.forEach(a => { params.push(a); paramIndex++; });
            }
        }


        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const query = `
            SELECT
                -- Identificadores de la transacción real
                p.id_pago,
                p.pagare_id,
                p.numero_pago,
                p.tipo_pago,

                -- Fecha real de cobro (fuente de verdad para ingresos)
                p.fecha_operacion                               AS fecha_pago,

                -- Montos reales cobrados (no del plan)
                p.capital_pagado::numeric                       AS capital,
                p.interes_pagado::numeric                       AS interes,
                p.mora_pagada::numeric                          AS mora_acumulada,
                p.total_pago::numeric                          AS monto_pagado,

                -- Saldo tras el pago (útil para auditoría)
                p.saldo_despues::numeric                        AS saldo_despues,

                -- Contexto del plan original (via calendario_pago)
                cp.fecha_vencimiento,
                cp.capital::numeric                             AS capital_programado,
                cp.interes::numeric                             AS interes_programado,
                cp.total_semana::numeric                        AS total_programado,
                COALESCE(cp.estatus, 'PAGADO')                  AS estatus,

                -- Contexto del crédito
                c.id_credito,
                s.id_solicitud,
                s.tipo_vencimiento,
                COALESCE(s.no_pagos, 16)                        AS no_pagos,

                -- Datos del cliente
                cli.id_cliente,
                cli.nombre_cliente,
                cli.app_cliente,
                cli.apm_cliente,
                TRIM(CONCAT(cli.nombre_cliente, ' ', cli.app_cliente, ' ',
                     COALESCE(cli.apm_cliente, '')))            AS nombre_completo,

                -- Aliado
                TRIM(COALESCE(a.nom_aliado, 'Sin Aliado'))      AS nom_aliado

            FROM pago p
            JOIN pagare pa          ON pa.id_pagare    = p.pagare_id
            JOIN credito c          ON c.id_credito    = p.credito_id
            JOIN solicitud s        ON s.id_solicitud  = c.solicitud_id
            JOIN cliente cli        ON cli.id_cliente  = s.cliente_id
            -- LEFT JOIN para obtener contexto del plan sin excluir pagos sin calendario
            LEFT JOIN calendario_pago cp
                ON  cp.pagare_id    = p.pagare_id
                AND cp.numero_pago  = p.numero_pago
            LEFT JOIN aliado a      ON a.id_aliado     = c.aliado_id
            ${whereClause}
            ORDER BY p.fecha_operacion DESC, p.id_pago DESC
        `;

        const result = await client.query(query, params);

        // ── Totales: sobre montos REALES cobrados ─────────────────────────────
        let total_ingresos  = 0;   // interés real cobrado
        let total_capital   = 0;   // capital real recuperado
        let total_mora      = 0;   // mora real cobrada (no acumulada)
        let total_recaudado = 0;   // total real de caja

        result.rows.forEach(row => {
            total_ingresos  += Number(row.interes)        || 0;
            total_capital   += Number(row.capital)        || 0;
            total_mora      += Number(row.mora_acumulada) || 0;
            total_recaudado += Number(row.monto_pagado)   || 0;
        });

        res.status(200).json({
            success: true,
            message: 'Ingresos obtenidos correctamente',
            ingresos: total_ingresos, // retrocompatibilidad con el frontend
            totales: {
                total_ingresos,
                total_capital,
                total_mora,
                total_recaudado,
                cantidad_pagos: result.rows.length
            },
            data: result.rows
        });

    } catch (error) {
        console.error('Error al obtener ingresos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            detalle: error.message
        });
    } finally {
        client.release();
    }
};

module.exports = {
    obtenerIngresos
};