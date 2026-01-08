// const pool = require('../config/db');

// class TreasuryModel {

//     // Reporte de Ministraciones
//     static async getMinistrationsReport(filters) {
//         const {
//             startDate,
//             endDate,
//             responsibleId,
//             municipality,
//             aliadoId
//         } = filters;

//         let query = `
//             SELECT 
//                 c.id_credito,
//                 c.fecha_ministracion,
//                 c.total_capital,
//                 c.total_interes,
//                 c.total_a_pagar,
//                 c.estado_credito,
//                 cl.nombre_cliente || ' ' || cl.app_cliente AS cliente_nombre,
//                 a.nom_aliado,
//                 u.nombre AS responsable,
//                 d.municipio,
//                 s.fecha_creacion,
//                 c.referencia_bancaria,
//                 c.cuenta_bancaria,
//                 p.numero_pagos,
//                 c.fecha_primer_pago
//             FROM credito c
//             INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
//             INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
//             INNER JOIN aliado a ON c.aliado_id = a.id_aliado
//             INNER JOIN usuario u ON s.usuario_id = u.id_usuario
//             INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
//             LEFT JOIN pagare p ON c.id_credito = p.credito_id
// <<<<<<< HEAD
//             WHERE c.estado_credito IN ('ENTREGADO', 'DEVOLUCIÓN')
// =======
//             WHERE c.estado_credito IN ('ENTREGADO', 'DEVOLUCIÓN', 'PENDIENTE')
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         `;

//         const params = [];
//         let paramCount = 1;
//         const conditions = [];

//         if (startDate) {
// <<<<<<< HEAD
//             conditions.push(`c.fecha_ministracion >= $${paramCount}`);
// =======
//             conditions.push(`c.fecha_ministracion >= $${paramCount} OR s.fecha_creacion >= $${paramCount}`);
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//             params.push(startDate);
//             paramCount++;
//         }

//         if (endDate) {
// <<<<<<< HEAD
//             conditions.push(`c.fecha_ministracion <= $${paramCount}`);
// =======
//             conditions.push(`c.fecha_ministracion <= $${paramCount} OR s.fecha_creacion <= $${paramCount}`);
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//             params.push(endDate);
//             paramCount++;
//         }

//         if (municipality) {
//             conditions.push(`d.municipio = $${paramCount}`);
//             params.push(municipality);
//             paramCount++;
//         }

//         if (responsibleId) {
//             conditions.push(`u.id_usuario = $${paramCount}`);
//             params.push(responsibleId);
//             paramCount++;
//         }

//         if (aliadoId) {
//             conditions.push(`a.id_aliado = $${paramCount}`);
//             params.push(aliadoId);
//             paramCount++;
//         }

//         if (conditions.length > 0) {
//             query += ' AND ' + conditions.join(' AND ');
//         }

// <<<<<<< HEAD
//         query += ` ORDER BY c.fecha_ministracion DESC`;
// =======
//         query += ` ORDER BY s.fecha_creacion DESC`;
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f

//         const result = await pool.query(query, params);

//         // 🔹 Separar y contar
//         const entregados = [];
//         const devolucion = [];
// <<<<<<< HEAD
// =======
//         const pendientes = [];
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f

//         for (const row of result.rows) {
//             if (row.estado_credito === 'ENTREGADO') {
//                 entregados.push(row);
//             } else if (row.estado_credito === 'DEVOLUCIÓN') {
//                 devolucion.push(row);
// <<<<<<< HEAD
// =======
//             } else if (row.estado_credito === 'PENDIENTE') {
//                 pendientes.push(row);
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//             }
//         }

//         return {
//             data: {
//                 entregados,
// <<<<<<< HEAD
//                 devolucion
//             },
//             totals: {
//                 entregados: entregados.length,
//                 devolucion: devolucion.length
// =======
//                 devolucion,
//                 pendientes
//             },
//             totales_estado: {
//                 entregados: entregados.length,
//                 devolucion: devolucion.length,
//                 pendientes: pendientes.length,
//                 total: result.rows.length
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//             }
//         };
//     }


//     // Reporte CORREGIDO: Capital y Cartera (basado en calendario_pago)
//     static async getCapitalReport(filters) {
//         const {
//             startDate,
//             endDate,
//             municipality,
//             aliadoId,
//             responsibleId,
//             estadoCredito,
//             fechaCorte = new Date().toISOString().split('T')[0]
//         } = filters;

//         // Primero, obtenemos los créditos activos (ENTREGADOS)
//         let query = `
//         WITH creditos_activos AS (
//             SELECT 
//                 c.id_credito,
//                 c.estado_credito,
//                 c.fecha_ministracion,
//                 c.total_capital,
//                 c.total_interes,
//                 c.total_a_pagar,
//                 c.saldo_pendiente,
//                 a.nom_aliado,
//                 cl.nombre_cliente || ' ' || cl.app_cliente AS cliente_nombre,
//                 d.municipio,
//                 u.nombre AS responsable,
//                 p.id_pagare,
//                 p.numero_pagos,
//                 c.fecha_primer_pago,
//                 -- Calcular semanas transcurridas
//                 CEIL(DATE_PART('day', $1::timestamp - c.fecha_primer_pago) / 7) AS semanas_transcurridas
//             FROM credito c
//             INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
//             INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
//             INNER JOIN aliado a ON c.aliado_id = a.id_aliado
//             INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
//             INNER JOIN usuario u ON s.usuario_id = u.id_usuario
//             LEFT JOIN pagare p ON c.id_credito = p.credito_id
//             WHERE c.estado_credito = 'ENTREGADO'
//     `;

//         const params = [fechaCorte];
//         let paramCount = 2;
//         const conditions = [];

//         if (startDate) {
//             conditions.push(`c.fecha_ministracion >= $${paramCount}`);
//             params.push(startDate);
//             paramCount++;
//         }

//         if (endDate) {
//             conditions.push(`c.fecha_ministracion <= $${paramCount}`);
//             params.push(endDate);
//             paramCount++;
//         }

//         if (municipality) {
//             conditions.push(`d.municipio = $${paramCount}`);
//             params.push(municipality);
//             paramCount++;
//         }

//         if (aliadoId) {
//             conditions.push(`a.id_aliado = $${paramCount}`);
//             params.push(aliadoId);
//             paramCount++;
//         }

//         if (responsibleId) {
//             conditions.push(`u.id_usuario = $${paramCount}`);
//             params.push(responsibleId);
//             paramCount++;
//         }

//         if (conditions.length > 0) {
//             query += ' AND ' + conditions.join(' AND ');
//         }

//         query += `
//         ),
//         pagos_calendario AS (
//             SELECT 
//                 ca.id_credito,
//                 cp.numero_pago,
//                 cp.fecha_vencimiento,
//                 cp.capital,
//                 cp.interes,
//                 cp.total_semana,
//                 cp.pagado,
//                 cp.fecha_pago,
//                 cp.mora_acumulada,
//                 cp.estatus,
//                 -- Determinar si el pago está vencido
//                 CASE 
//                     WHEN cp.fecha_vencimiento < $1 AND cp.pagado = false THEN 'VENCIDO'
//                     WHEN cp.fecha_vencimiento >= $1 AND cp.pagado = false THEN 'PENDIENTE'
//                     ELSE 'PAGADO'
//                 END AS estado_pago
//             FROM creditos_activos ca
//             LEFT JOIN calendario_pago cp ON ca.id_pagare = cp.pagare_id
//         ),
//         analisis_cartera AS (
//             SELECT 
//                 ca.id_credito,
//                 -- Verificar si tiene pagos vencidos
//                 EXISTS (
//                     SELECT 1 
//                     FROM pagos_calendario pc 
//                     WHERE pc.id_credito = ca.id_credito 
//                     AND pc.estado_pago = 'VENCIDO'
//                 ) AS tiene_pagos_vencidos,
//                 -- Contar pagos vencidos
//                 (
//                     SELECT COUNT(*) 
//                     FROM pagos_calendario pc 
//                     WHERE pc.id_credito = ca.id_credito 
//                     AND pc.estado_pago = 'VENCIDO'
//                 ) AS total_pagos_vencidos,
//                 -- Contar pagos pendientes
//                 (
//                     SELECT COUNT(*) 
//                     FROM pagos_calendario pc 
//                     WHERE pc.id_credito = ca.id_credito 
//                     AND pc.estado_pago = 'PENDIENTE'
//                 ) AS total_pagos_pendientes,
//                 -- Contar pagos realizados
//                 (
//                     SELECT COUNT(*) 
//                     FROM pagos_calendario pc 
//                     WHERE pc.id_credito = ca.id_credito 
//                     AND pc.estado_pago = 'PAGADO'
//                 ) AS total_pagos_realizados
//             FROM creditos_activos ca
//         ),
//         resumen_credito AS (
//             SELECT 
//                 ca.*,
//                 ac.tiene_pagos_vencidos,
//                 ac.total_pagos_vencidos,
//                 ac.total_pagos_pendientes,
//                 ac.total_pagos_realizados,
//                 -- Totales del calendario
//                 COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.capital ELSE 0 END), 0) AS capital_pagado,
//                 COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.interes ELSE 0 END), 0) AS interes_pagado,
//                 COALESCE(SUM(cp.mora_acumulada), 0) AS mora_acumulada_total,
//                 -- Determinar estado de cartera
//                 CASE 
//                     WHEN ca.semanas_transcurridas > ca.numero_pagos 
//                          AND ac.tiene_pagos_vencidos = true THEN 'CARTERA VENCIDA'
//                     WHEN ca.semanas_transcurridas <= ca.numero_pagos 
//                          AND ac.tiene_pagos_vencidos = true THEN 'CARTERA CORRIENTE'
//                     WHEN ca.semanas_transcurridas > ca.numero_pagos 
//                          AND ac.total_pagos_realizados = ca.numero_pagos THEN 'LIQUIDADO'
//                     WHEN ca.semanas_transcurridas <= ca.numero_pagos 
//                          AND ac.tiene_pagos_vencidos = false THEN 'EN CURSO'
//                     ELSE 'REGULAR'
//                 END AS estado_cartera
//             FROM creditos_activos ca
//             LEFT JOIN analisis_cartera ac ON ca.id_credito = ac.id_credito
//             LEFT JOIN pagos_calendario cp ON ca.id_credito = cp.id_credito
//             GROUP BY 
//                 ca.id_credito, ca.estado_credito, ca.fecha_ministracion, 
//                 ca.total_capital, ca.total_interes, ca.total_a_pagar, 
//                 ca.saldo_pendiente, ca.nom_aliado, ca.cliente_nombre, 
//                 ca.municipio, ca.responsable, ca.id_pagare, 
//                 ca.numero_pagos, ca.fecha_primer_pago, ca.semanas_transcurridas,
//                 ac.tiene_pagos_vencidos, ac.total_pagos_vencidos,
//                 ac.total_pagos_pendientes, ac.total_pagos_realizados
//         )
//         SELECT 
//             *,
//             (total_capital - capital_pagado) AS saldo_capital,
//             (total_interes - interes_pagado) AS saldo_interes,
//             ((total_capital - capital_pagado) + (total_interes - interes_pagado)) AS saldo_total_pendiente
//         FROM resumen_credito
//         ORDER BY 
//             CASE estado_cartera 
//                 WHEN 'CARTERA VENCIDA' THEN 1
//                 WHEN 'CARTERA CORRIENTE' THEN 2
//                 WHEN 'EN CURSO' THEN 3
//                 ELSE 4
//             END,
//             fecha_ministracion DESC
//     `;

//         const result = await pool.query(query, params);
//         return result.rows;
//     }

//     // Reporte Detallado de Pagos (para análisis de mora)
//     static async getPaymentDetailReport(filters) {
//         const {
//             startDate,
//             endDate,
//             municipality,
//             aliadoId,
//             estadoPago,
//             fechaCorte = new Date().toISOString().split('T')[0]
//         } = filters;

//         let query = `
//             SELECT 
//                 c.id_credito,
//                 c.estado_credito,
//                 cl.nombre_cliente || ' ' || cl.app_cliente AS cliente_nombre,
//                 d.municipio,
//                 a.nom_aliado,
//                 cp.numero_pago,
//                 cp.fecha_vencimiento,
//                 cp.capital,
//                 cp.interes,
//                 cp.total_semana,
//                 cp.mora_acumulada,
//                 cp.pagado,
//                 cp.fecha_pago,
//                 cp.estatus,
//                 -- Días de atraso
//                 CASE 
//                     WHEN cp.pagado = false AND cp.fecha_vencimiento < $1 
//                     THEN DATE_PART('day', $1::timestamp - cp.fecha_vencimiento)
//                     ELSE 0 
//                 END AS dias_atraso,
//                 -- Semana del ciclo
//                 ROW_NUMBER() OVER (PARTITION BY c.id_credito ORDER BY cp.numero_pago) as semana_ciclo,
//                 p.numero_pagos as total_semanas
//             FROM credito c
//             INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
//             INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
//             INNER JOIN aliado a ON c.aliado_id = a.id_aliado
//             INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
//             INNER JOIN pagare p ON c.id_credito = p.credito_id
//             INNER JOIN calendario_pago cp ON p.id_pagare = cp.pagare_id
//             WHERE c.estado_credito = 'ENTREGADO'
//         `;

//         const params = [fechaCorte];
//         let paramCount = 2;
//         const conditions = [];

//         if (startDate) {
//             conditions.push(`c.fecha_ministracion >= $${paramCount}`);
//             params.push(startDate);
//             paramCount++;
//         }

//         if (endDate) {
//             conditions.push(`c.fecha_ministracion <= $${paramCount}`);
//             params.push(endDate);
//             paramCount++;
//         }

//         if (municipality) {
//             conditions.push(`d.municipio = $${paramCount}`);
//             params.push(municipality);
//             paramCount++;
//         }

//         if (aliadoId) {
//             conditions.push(`a.id_aliado = $${paramCount}`);
//             params.push(aliadoId);
//             paramCount++;
//         }

//         if (estadoPago) {
//             if (estadoPago === 'VENCIDO') {
//                 conditions.push(`cp.pagado = false AND cp.fecha_vencimiento < $1`);
//             } else if (estadoPago === 'PENDIENTE') {
//                 conditions.push(`cp.pagado = false AND cp.fecha_vencimiento >= $1`);
//             } else if (estadoPago === 'PAGADO') {
//                 conditions.push(`cp.pagado = true`);
//             }
//         }

//         if (conditions.length > 0) {
//             query += ' AND ' + conditions.join(' AND ');
//         }

//         query += `
//             ORDER BY 
//                 c.id_credito,
//                 cp.numero_pago
//         `;

//         const result = await pool.query(query, params);
//         return result.rows;
//     }

//     // Reporte de Cartera Vencida vs Corriente (Resumen por responsable)
//     static async getPortfolioSummary(filters) {
//         const {
//             startDate,
//             endDate,
//             responsibleId,
//             municipality,
//             fechaCorte = new Date().toISOString().split('T')[0]
//         } = filters;

//         let query = `
//             WITH resumen_cartera AS (
//                 SELECT 
//                     u.id_usuario,
//                     u.nombre AS responsable,
//                     d.municipio,
//                     COUNT(DISTINCT c.id_credito) AS total_creditos,
//                     SUM(c.total_capital) AS capital_total,
//                     SUM(c.total_interes) AS interes_total,
//                     COUNT(DISTINCT cl.id_cliente) AS total_clientes,
//                     -- Cartera Vencida (terminó ciclo y tiene pagos vencidos)
//                     COUNT(DISTINCT CASE 
//                         WHEN ca.semanas_transcurridas > p.numero_pagos 
//                              AND EXISTS (
//                                  SELECT 1 
//                                  FROM calendario_pago cp 
//                                  WHERE cp.pagare_id = p.id_pagare 
//                                  AND cp.pagado = false
//                                  AND cp.fecha_vencimiento < $1
//                              ) THEN c.id_credito
//                     END) AS creditos_vencidos,
//                     -- Cartera Corriente (dentro del ciclo con mora)
//                     COUNT(DISTINCT CASE 
//                         WHEN ca.semanas_transcurridas <= p.numero_pagos 
//                              AND EXISTS (
//                                  SELECT 1 
//                                  FROM calendario_pago cp 
//                                  WHERE cp.pagare_id = p.id_pagare 
//                                  AND cp.pagado = false
//                                  AND cp.fecha_vencimiento < $1
//                              ) THEN c.id_credito
//                     END) AS creditos_corrientes_mora,
//                     -- Cartera Regular (sin mora)
//                     COUNT(DISTINCT CASE 
//                         WHEN NOT EXISTS (
//                             SELECT 1 
//                             FROM calendario_pago cp 
//                             WHERE cp.pagare_id = p.id_pagare 
//                             AND cp.pagado = false
//                             AND cp.fecha_vencimiento < $1
//                         ) THEN c.id_credito
//                     END) AS creditos_regulares,
//                     -- Montos de mora
//                     COALESCE(SUM(cp.mora_acumulada), 0) AS mora_total
//                 FROM credito c
//                 INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
//                 INNER JOIN usuario u ON s.usuario_id = u.id_usuario
//                 INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
//                 INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
//                 INNER JOIN pagare p ON c.id_credito = p.credito_id
//                 LEFT JOIN calendario_pago cp ON p.id_pagare = cp.pagare_id
//                 CROSS JOIN LATERAL (
//                     SELECT CEIL(DATE_PART('day', $1::timestamp - c.fecha_primer_pago) / 7) AS semanas_transcurridas
//                 ) ca
//                 WHERE c.estado_credito = 'ENTREGADO'
//         `;

//         const params = [fechaCorte];
//         let paramCount = 2;
//         const conditions = [];

//         if (startDate) {
//             conditions.push(`c.fecha_ministracion >= $${paramCount}`);
//             params.push(startDate);
//             paramCount++;
//         }

//         if (endDate) {
//             conditions.push(`c.fecha_ministracion <= $${paramCount}`);
//             params.push(endDate);
//             paramCount++;
//         }

//         if (responsibleId) {
//             conditions.push(`u.id_usuario = $${paramCount}`);
//             params.push(responsibleId);
//             paramCount++;
//         }

//         if (municipality) {
//             conditions.push(`d.municipio = $${paramCount}`);
//             params.push(municipality);
//             paramCount++;
//         }

//         if (conditions.length > 0) {
//             query += ' AND ' + conditions.join(' AND ');
//         }

//         query += `
//                 GROUP BY 
//                     u.id_usuario, u.nombre, d.municipio
//             )
//             SELECT 
//                 *,
//                 -- Porcentajes
//                 ROUND((creditos_vencidos * 100.0 / NULLIF(total_creditos, 0)), 2) AS porcentaje_vencidos,
//                 ROUND((creditos_corrientes_mora * 100.0 / NULLIF(total_creditos, 0)), 2) AS porcentaje_corrientes_mora,
//                 ROUND((creditos_regulares * 100.0 / NULLIF(total_creditos, 0)), 2) AS porcentaje_regulares
//             FROM resumen_cartera
//             ORDER BY 
//                 mora_total DESC,
//                 creditos_vencidos DESC
//         `;

//         const result = await pool.query(query, params);
//         return result.rows;
//     }

//     // Obtener municipios disponibles para filtros
//     static async getMunicipalities() {
//         const query = `
//             SELECT DISTINCT municipio 
//             FROM direccion 
//             WHERE municipio IS NOT NULL 
//             ORDER BY municipio
//         `;
//         const result = await pool.query(query);
//         return result.rows.map(row => row.municipio);
//     }

//     // Obtener responsables disponibles
//     static async getResponsibles() {
//         const query = `
//             SELECT u.id_usuario, u.nombre, u.usuario
//             FROM usuario u
//             INNER JOIN rol r ON u.rol_id = r.id_rol
//             WHERE r.nombre_rol IN ('ASESOR', 'SUPERVISOR', 'GERENTE')
//             ORDER BY u.nombre
//         `;
//         const result = await pool.query(query);
//         return result.rows;
//     }

//     // Obtener aliados disponibles
//     static async getAliados() {
//         const query = `
//             SELECT id_aliado, nom_aliado
//             FROM aliado
//             ORDER BY nom_aliado
//         `;
//         const result = await pool.query(query);
//         return result.rows;
//     }

//     // Obtener estados de cartera para filtros
//     static async getCarteraEstados() {
//         return [
//             { value: 'CARTERA VENCIDA', label: 'Cartera Vencida' },
//             { value: 'CARTERA CORRIENTE', label: 'Cartera Corriente (con mora)' },
//             { value: 'EN CURSO', label: 'En Curso (sin mora)' },
//             { value: 'LIQUIDADO', label: 'Liquidado' },
//             { value: 'REGULAR', label: 'Regular' }
//         ];
//     }
// <<<<<<< HEAD
// =======
//     // Obtener filtros de fecha por periodo
//     static getFiltersByPeriod(periodo) {
//         const now = new Date();
//         const endDate = now.toISOString().split('T')[0];
//         let startDate = new Date();

//         switch (periodo) {
//             case 'semana':
//                 // Inicio de la semana (Lunes)
//                 const day = now.getDay();
//                 const diff = now.getDate() - day + (day === 0 ? -6 : 1);
//                 startDate.setDate(diff);
//                 break;
//             case 'mes':
//                 startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//                 break;
//             case 'trimestre':
//                 const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
//                 startDate = new Date(now.getFullYear(), quarterMonth, 1);
//                 break;
//             case 'anio':
//                 startDate = new Date(now.getFullYear(), 0, 1);
//                 break;
//             default: // mes por defecto
//                 startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//         }

//         return {
//             startDate: startDate.toISOString().split('T')[0],
//             endDate,
//             periodo
//         };
//     }

//     // Obtener estadísticas para el dashboard
//     static async getDashboardStatistics(filters) {
//         const { startDate, endDate } = filters;

//         // Consultas básicas de indicadores financieros
//         const query = `
//             WITH metrics AS (
//                 SELECT 
//                     -- Total ministrado en el periodo
//                     COALESCE(SUM(CASE WHEN fecha_ministracion BETWEEN $1 AND $2 THEN total_capital ELSE 0 END), 0) as ministrado_periodo,
                    
//                     -- Num créditos nuevos en el periodo
//                     COUNT(CASE WHEN fecha_ministracion BETWEEN $1 AND $2 THEN id_credito END) as nuevos_creditos,
                    
//                     -- Total cobrado (capital + interes) en el periodo base a fecha de pago real
//                     (
//                         SELECT COALESCE(SUM(capital + interes), 0)
//                         FROM calendario_pago
//                         WHERE fecha_pago BETWEEN $1 AND $2
//                         AND pagado = true
//                     ) as cobrado_total,
                    
//                     -- Interés generado (cobrado) en el periodo
//                     (
//                         SELECT COALESCE(SUM(interes), 0)
//                         FROM calendario_pago
//                         WHERE fecha_pago BETWEEN $1 AND $2
//                         AND pagado = true
//                     ) as interes_cobrado,
                    
//                     -- Mora cobrada en el periodo
//                     (
//                         SELECT COALESCE(SUM(mora_acumulada), 0)
//                         FROM calendario_pago
//                         WHERE fecha_pago BETWEEN $1 AND $2
//                         AND pagado = true
//                     ) as mora_cobrada

//                 FROM credito
//                 WHERE estado_credito != 'CANCELADO'
//             )
//             SELECT * FROM metrics
//         `;

//         const result = await pool.query(query, [startDate, endDate]);
//         return result.rows[0];
//     }

//     static async getDashboardData(periodo) {
//         console.log('Obteniendo datos del dashboard para periodo:', periodo);

//         // Obtener fechas según el período
//         const dateFilter = this.getPeriodoFilter(periodo);
//         const params = [];

//         let query = `
//         WITH estadisticas_creditos AS (
//             SELECT 
//                 c.id_credito,
//                 c.fecha_ministracion,
//                 c.total_capital,
//                 c.total_interes,
//                 c.total_a_pagar,
//                 c.saldo_pendiente,
//                 c.estado_credito,
//                 cl.nombre_cliente || ' ' || cl.app_cliente AS nombre_cliente,
//                 a.nom_aliado,
//                 u.nombre AS responsable,
//                 d.municipio,
//                 -- Calcular semanas transcurridas
//                 CEIL(DATE_PART('day', CURRENT_DATE - c.fecha_primer_pago) / 7) AS semanas_transcurridas,
//                 p.numero_pagos
//             FROM credito c
//             INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
//             INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
//             INNER JOIN aliado a ON c.aliado_id = a.id_aliado
//             INNER JOIN usuario u ON s.usuario_id = u.id_usuario
//             INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
//             INNER JOIN pagare p ON c.id_credito = p.credito_id
//             WHERE c.estado_credito = 'ENTREGADO'
//     `;

//         // Filtrar por período si aplica
//         if (periodo && periodo !== 'personalizado' && dateFilter) {
//             query += ` AND c.fecha_ministracion >= $${params.length + 1}`;
//             params.push(dateFilter);
//         }

//         query += `
//         ),
//         pagos_info AS (
//             SELECT 
//                 ec.id_credito,
//                 COUNT(cp.id_calendario) AS total_pagos,
//                 SUM(CASE WHEN cp.pagado = true THEN 1 ELSE 0 END) AS pagos_realizados,
//                 SUM(CASE WHEN cp.pagado = false AND cp.fecha_vencimiento < CURRENT_DATE THEN 1 ELSE 0 END) AS pagos_vencidos,
//                 COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.capital ELSE 0 END), 0) AS capital_pagado,
//                 COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.interes ELSE 0 END), 0) AS interes_pagado,
//                 COALESCE(SUM(cp.mora_acumulada), 0) AS mora_total
//             FROM estadisticas_creditos ec
//             LEFT JOIN calendario_pago cp ON cp.pagare_id = (
//                 SELECT id_pagare FROM pagare WHERE credito_id = ec.id_credito LIMIT 1
//             )
//             GROUP BY ec.id_credito
//         ),
//         estado_cartera AS (
//             SELECT 
//                 ec.*,
//                 pi.total_pagos,
//                 pi.pagos_realizados,
//                 pi.pagos_vencidos,
//                 pi.capital_pagado,
//                 pi.interes_pagado,
//                 pi.mora_total,
//                 -- Determinar estado de cartera
//                 CASE 
//                     WHEN ec.semanas_transcurridas > ec.numero_pagos 
//                          AND pi.pagos_vencidos > 0 THEN 'CARTERA VENCIDA'
//                     WHEN ec.semanas_transcurridas <= ec.numero_pagos 
//                          AND pi.pagos_vencidos > 0 THEN 'CARTERA CORRIENTE'
//                     WHEN ec.semanas_transcurridas > ec.numero_pagos 
//                          AND pi.pagos_realizados = ec.numero_pagos THEN 'LIQUIDADO'
//                     WHEN ec.semanas_transcurridas <= ec.numero_pagos 
//                          AND pi.pagos_vencidos = 0 THEN 'EN CURSO'
//                     ELSE 'REGULAR'
//                 END AS estado_cartera
//             FROM estadisticas_creditos ec
//             INNER JOIN pagos_info pi ON ec.id_credito = pi.id_credito
//         )
//         SELECT 
//             id_credito,
//             nombre_cliente,
//             total_capital AS monto_credito,
//             fecha_ministracion AS fecha_desembolso,
//             estado_cartera,
//             capital_pagado,
//             mora_total,
//             total_capital - capital_pagado AS saldo_capital,
//             municipio,
//             nom_aliado,
//             responsable,
//             semanas_transcurridas,
//             numero_pagos,
//             pagos_realizados,
//             pagos_vencidos
//         FROM estado_cartera
//         ORDER BY 
//             CASE estado_cartera 
//                 WHEN 'CARTERA VENCIDA' THEN 1
//                 WHEN 'CARTERA CORRIENTE' THEN 2
//                 WHEN 'EN CURSO' THEN 3
//                 ELSE 4
//             END,
//             fecha_ministracion DESC
//         LIMIT 500
//     `;

//         try {
//             console.log('Ejecutando query dashboard con params:', params);
//             const result = await pool.query(query, params);
//             console.log(`Datos obtenidos: ${result.rows.length} registros`);
//             return result.rows;
//         } catch (error) {
//             console.error('Error en getDashboardData:', error);
//             throw error;
//         }
//     }


// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
// }

// module.exports = TreasuryModel; 
const pool = require('../config/db');

class TreasuryModel {

    // Reporte de Ministraciones
    static async getMinistrationsReport(filters) {
        const {
            startDate,
            endDate,
            responsibleId,
            municipality,
            aliadoId
        } = filters;

        let query = `
            SELECT 
                c.id_credito,
                c.fecha_ministracion,
                c.total_capital,
                c.total_interes,
                c.total_a_pagar,
                c.estado_credito,
                cl.nombre_cliente || ' ' || cl.app_cliente AS cliente_nombre,
                a.nom_aliado,
                u.nombre AS responsable,
                d.municipio,
                s.fecha_creacion,
                c.referencia_bancaria,
                c.cuenta_bancaria,
                p.numero_pagos,
                c.fecha_primer_pago
            FROM credito c
            INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
            INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
            INNER JOIN aliado a ON c.aliado_id = a.id_aliado
            INNER JOIN usuario u ON s.usuario_id = u.id_usuario
            INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
            LEFT JOIN pagare p ON c.id_credito = p.credito_id
            WHERE c.estado_credito IN ('ENTREGADO', 'DEVOLUCIÓN', 'PENDIENTE')
        `;

        const params = [];
        let paramCount = 1;
        const conditions = [];

        if (startDate) {
            conditions.push(`c.fecha_ministracion >= $${paramCount} OR s.fecha_creacion >= $${paramCount}`);
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            conditions.push(`c.fecha_ministracion <= $${paramCount} OR s.fecha_creacion <= $${paramCount}`);
            params.push(endDate);
            paramCount++;
        }

        if (municipality) {
            conditions.push(`d.municipio = $${paramCount}`);
            params.push(municipality);
            paramCount++;
        }

        if (responsibleId) {
            conditions.push(`u.id_usuario = $${paramCount}`);
            params.push(responsibleId);
            paramCount++;
        }

        if (aliadoId) {
            conditions.push(`a.id_aliado = $${paramCount}`);
            params.push(aliadoId);
            paramCount++;
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += ` ORDER BY s.fecha_creacion DESC`;

        const result = await pool.query(query, params);

        // 🔹 Separar y contar
        const entregados = [];
        const devolucion = [];
        const pendientes = [];

        for (const row of result.rows) {
            if (row.estado_credito === 'ENTREGADO') {
                entregados.push(row);
            } else if (row.estado_credito === 'DEVOLUCIÓN') {
                devolucion.push(row);
            } else if (row.estado_credito === 'PENDIENTE') {
                pendientes.push(row);
            }
        }

        return {
            data: {
                entregados,
                devolucion,
                pendientes
            },
            totales_estado: {
                entregados: entregados.length,
                devolucion: devolucion.length,
                pendientes: pendientes.length,
                total: result.rows.length
            }
        };
    }


    // Reporte CORREGIDO: Capital y Cartera (basado en calendario_pago)
    static async getCapitalReport(filters) {
        const {
            startDate,
            endDate,
            municipality,
            aliadoId,
            responsibleId,
            estadoCredito,
            fechaCorte = new Date().toISOString().split('T')[0]
        } = filters;

        // Primero, obtenemos los créditos activos (ENTREGADOS)
        let query = `
        WITH creditos_activos AS (
            SELECT 
                c.id_credito,
                c.estado_credito,
                c.fecha_ministracion,
                c.total_capital,
                c.total_interes,
                c.total_a_pagar,
                c.saldo_pendiente,
                a.nom_aliado,
                cl.nombre_cliente || ' ' || cl.app_cliente AS cliente_nombre,
                d.municipio,
                u.nombre AS responsable,
                p.id_pagare,
                p.numero_pagos,
                c.fecha_primer_pago,
                -- Calcular semanas transcurridas
                CEIL(DATE_PART('day', $1::timestamp - c.fecha_primer_pago) / 7) AS semanas_transcurridas
            FROM credito c
            INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
            INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
            INNER JOIN aliado a ON c.aliado_id = a.id_aliado
            INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
            INNER JOIN usuario u ON s.usuario_id = u.id_usuario
            LEFT JOIN pagare p ON c.id_credito = p.credito_id
            WHERE c.estado_credito = 'ENTREGADO'
    `;

        const params = [fechaCorte];
        let paramCount = 2;
        const conditions = [];

        if (startDate) {
            conditions.push(`c.fecha_ministracion >= $${paramCount}`);
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            conditions.push(`c.fecha_ministracion <= $${paramCount}`);
            params.push(endDate);
            paramCount++;
        }

        if (municipality) {
            conditions.push(`d.municipio = $${paramCount}`);
            params.push(municipality);
            paramCount++;
        }

        if (aliadoId) {
            conditions.push(`a.id_aliado = $${paramCount}`);
            params.push(aliadoId);
            paramCount++;
        }

        if (responsibleId) {
            conditions.push(`u.id_usuario = $${paramCount}`);
            params.push(responsibleId);
            paramCount++;
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += `
        ),
        pagos_calendario AS (
            SELECT 
                ca.id_credito,
                cp.numero_pago,
                cp.fecha_vencimiento,
                cp.capital,
                cp.interes,
                cp.total_semana,
                cp.pagado,
                cp.fecha_pago,
                cp.mora_acumulada,
                cp.estatus,
                -- Determinar si el pago está vencido
                CASE 
                    WHEN cp.fecha_vencimiento < $1 AND cp.pagado = false THEN 'VENCIDO'
                    WHEN cp.fecha_vencimiento >= $1 AND cp.pagado = false THEN 'PENDIENTE'
                    ELSE 'PAGADO'
                END AS estado_pago
            FROM creditos_activos ca
            LEFT JOIN calendario_pago cp ON ca.id_pagare = cp.pagare_id
        ),
        analisis_cartera AS (
            SELECT 
                ca.id_credito,
                -- Verificar si tiene pagos vencidos
                EXISTS (
                    SELECT 1 
                    FROM pagos_calendario pc 
                    WHERE pc.id_credito = ca.id_credito 
                    AND pc.estado_pago = 'VENCIDO'
                ) AS tiene_pagos_vencidos,
                -- Contar pagos vencidos
                (
                    SELECT COUNT(*) 
                    FROM pagos_calendario pc 
                    WHERE pc.id_credito = ca.id_credito 
                    AND pc.estado_pago = 'VENCIDO'
                ) AS total_pagos_vencidos,
                -- Contar pagos pendientes
                (
                    SELECT COUNT(*) 
                    FROM pagos_calendario pc 
                    WHERE pc.id_credito = ca.id_credito 
                    AND pc.estado_pago = 'PENDIENTE'
                ) AS total_pagos_pendientes,
                -- Contar pagos realizados
                (
                    SELECT COUNT(*) 
                    FROM pagos_calendario pc 
                    WHERE pc.id_credito = ca.id_credito 
                    AND pc.estado_pago = 'PAGADO'
                ) AS total_pagos_realizados
            FROM creditos_activos ca
        ),
        resumen_credito AS (
            SELECT 
                ca.*,
                ac.tiene_pagos_vencidos,
                ac.total_pagos_vencidos,
                ac.total_pagos_pendientes,
                ac.total_pagos_realizados,
                -- Totales del calendario
                COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.capital ELSE 0 END), 0) AS capital_pagado,
                COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.interes ELSE 0 END), 0) AS interes_pagado,
                COALESCE(SUM(cp.mora_acumulada), 0) AS mora_acumulada_total,
                -- Determinar estado de cartera
                CASE 
                    WHEN ca.semanas_transcurridas > ca.numero_pagos 
                         AND ac.tiene_pagos_vencidos = true THEN 'CARTERA VENCIDA'
                    WHEN ca.semanas_transcurridas <= ca.numero_pagos 
                         AND ac.tiene_pagos_vencidos = true THEN 'CARTERA CORRIENTE'
                    WHEN ca.semanas_transcurridas > ca.numero_pagos 
                         AND ac.total_pagos_realizados = ca.numero_pagos THEN 'LIQUIDADO'
                    WHEN ca.semanas_transcurridas <= ca.numero_pagos 
                         AND ac.tiene_pagos_vencidos = false THEN 'EN CURSO'
                    ELSE 'REGULAR'
                END AS estado_cartera
            FROM creditos_activos ca
            LEFT JOIN analisis_cartera ac ON ca.id_credito = ac.id_credito
            LEFT JOIN pagos_calendario cp ON ca.id_credito = cp.id_credito
            GROUP BY 
                ca.id_credito, ca.estado_credito, ca.fecha_ministracion, 
                ca.total_capital, ca.total_interes, ca.total_a_pagar, 
                ca.saldo_pendiente, ca.nom_aliado, ca.cliente_nombre, 
                ca.municipio, ca.responsable, ca.id_pagare, 
                ca.numero_pagos, ca.fecha_primer_pago, ca.semanas_transcurridas,
                ac.tiene_pagos_vencidos, ac.total_pagos_vencidos,
                ac.total_pagos_pendientes, ac.total_pagos_realizados
        )
        SELECT 
            *,
            (total_capital - capital_pagado) AS saldo_capital,
            (total_interes - interes_pagado) AS saldo_interes,
            ((total_capital - capital_pagado) + (total_interes - interes_pagado)) AS saldo_total_pendiente
        FROM resumen_credito
        ORDER BY 
            CASE estado_cartera 
                WHEN 'CARTERA VENCIDA' THEN 1
                WHEN 'CARTERA CORRIENTE' THEN 2
                WHEN 'EN CURSO' THEN 3
                ELSE 4
            END,
            fecha_ministracion DESC
    `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Reporte Detallado de Pagos (para análisis de mora)
    static async getPaymentDetailReport(filters) {
        const {
            startDate,
            endDate,
            municipality,
            aliadoId,
            estadoPago,
            fechaCorte = new Date().toISOString().split('T')[0]
        } = filters;

        let query = `
            SELECT 
                c.id_credito,
                c.estado_credito,
                cl.nombre_cliente || ' ' || cl.app_cliente AS cliente_nombre,
                d.municipio,
                a.nom_aliado,
                cp.numero_pago,
                cp.fecha_vencimiento,
                cp.capital,
                cp.interes,
                cp.total_semana,
                cp.mora_acumulada,
                cp.pagado,
                cp.fecha_pago,
                cp.estatus,
                -- Días de atraso
                CASE 
                    WHEN cp.pagado = false AND cp.fecha_vencimiento < $1 
                    THEN DATE_PART('day', $1::timestamp - cp.fecha_vencimiento)
                    ELSE 0 
                END AS dias_atraso,
                -- Semana del ciclo
                ROW_NUMBER() OVER (PARTITION BY c.id_credito ORDER BY cp.numero_pago) as semana_ciclo,
                p.numero_pagos as total_semanas
            FROM credito c
            INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
            INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
            INNER JOIN aliado a ON c.aliado_id = a.id_aliado
            INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
            INNER JOIN pagare p ON c.id_credito = p.credito_id
            INNER JOIN calendario_pago cp ON p.id_pagare = cp.pagare_id
            WHERE c.estado_credito = 'ENTREGADO'
        `;

        const params = [fechaCorte];
        let paramCount = 2;
        const conditions = [];

        if (startDate) {
            conditions.push(`c.fecha_ministracion >= $${paramCount}`);
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            conditions.push(`c.fecha_ministracion <= $${paramCount}`);
            params.push(endDate);
            paramCount++;
        }

        if (municipality) {
            conditions.push(`d.municipio = $${paramCount}`);
            params.push(municipality);
            paramCount++;
        }

        if (aliadoId) {
            conditions.push(`a.id_aliado = $${paramCount}`);
            params.push(aliadoId);
            paramCount++;
        }

        if (estadoPago) {
            if (estadoPago === 'VENCIDO') {
                conditions.push(`cp.pagado = false AND cp.fecha_vencimiento < $1`);
            } else if (estadoPago === 'PENDIENTE') {
                conditions.push(`cp.pagado = false AND cp.fecha_vencimiento >= $1`);
            } else if (estadoPago === 'PAGADO') {
                conditions.push(`cp.pagado = true`);
            }
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += `
            ORDER BY 
                c.id_credito,
                cp.numero_pago
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Reporte de Cartera Vencida vs Corriente (Resumen por responsable)
    static async getPortfolioSummary(filters) {
        const {
            startDate,
            endDate,
            responsibleId,
            municipality,
            fechaCorte = new Date().toISOString().split('T')[0]
        } = filters;

        let query = `
            WITH resumen_cartera AS (
                SELECT 
                    u.id_usuario,
                    u.nombre AS responsable,
                    d.municipio,
                    COUNT(DISTINCT c.id_credito) AS total_creditos,
                    SUM(c.total_capital) AS capital_total,
                    SUM(c.total_interes) AS interes_total,
                    COUNT(DISTINCT cl.id_cliente) AS total_clientes,
                    -- Cartera Vencida (terminó ciclo y tiene pagos vencidos)
                    COUNT(DISTINCT CASE 
                        WHEN ca.semanas_transcurridas > p.numero_pagos 
                             AND EXISTS (
                                 SELECT 1 
                                 FROM calendario_pago cp 
                                 WHERE cp.pagare_id = p.id_pagare 
                                 AND cp.pagado = false
                                 AND cp.fecha_vencimiento < $1
                             ) THEN c.id_credito
                    END) AS creditos_vencidos,
                    -- Cartera Corriente (dentro del ciclo con mora)
                    COUNT(DISTINCT CASE 
                        WHEN ca.semanas_transcurridas <= p.numero_pagos 
                             AND EXISTS (
                                 SELECT 1 
                                 FROM calendario_pago cp 
                                 WHERE cp.pagare_id = p.id_pagare 
                                 AND cp.pagado = false
                                 AND cp.fecha_vencimiento < $1
                             ) THEN c.id_credito
                    END) AS creditos_corrientes_mora,
                    -- Cartera Regular (sin mora)
                    COUNT(DISTINCT CASE 
                        WHEN NOT EXISTS (
                            SELECT 1 
                            FROM calendario_pago cp 
                            WHERE cp.pagare_id = p.id_pagare 
                            AND cp.pagado = false
                            AND cp.fecha_vencimiento < $1
                        ) THEN c.id_credito
                    END) AS creditos_regulares,
                    -- Montos de mora
                    COALESCE(SUM(cp.mora_acumulada), 0) AS mora_total
                FROM credito c
                INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
                INNER JOIN usuario u ON s.usuario_id = u.id_usuario
                INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
                INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
                INNER JOIN pagare p ON c.id_credito = p.credito_id
                LEFT JOIN calendario_pago cp ON p.id_pagare = cp.pagare_id
                CROSS JOIN LATERAL (
                    SELECT CEIL(DATE_PART('day', $1::timestamp - c.fecha_primer_pago) / 7) AS semanas_transcurridas
                ) ca
                WHERE c.estado_credito = 'ENTREGADO'
        `;

        const params = [fechaCorte];
        let paramCount = 2;
        const conditions = [];

        if (startDate) {
            conditions.push(`c.fecha_ministracion >= $${paramCount}`);
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            conditions.push(`c.fecha_ministracion <= $${paramCount}`);
            params.push(endDate);
            paramCount++;
        }

        if (responsibleId) {
            conditions.push(`u.id_usuario = $${paramCount}`);
            params.push(responsibleId);
            paramCount++;
        }

        if (municipality) {
            conditions.push(`d.municipio = $${paramCount}`);
            params.push(municipality);
            paramCount++;
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += `
                GROUP BY 
                    u.id_usuario, u.nombre, d.municipio
            )
            SELECT 
                *,
                -- Porcentajes
                ROUND((creditos_vencidos * 100.0 / NULLIF(total_creditos, 0)), 2) AS porcentaje_vencidos,
                ROUND((creditos_corrientes_mora * 100.0 / NULLIF(total_creditos, 0)), 2) AS porcentaje_corrientes_mora,
                ROUND((creditos_regulares * 100.0 / NULLIF(total_creditos, 0)), 2) AS porcentaje_regulares
            FROM resumen_cartera
            ORDER BY 
                mora_total DESC,
                creditos_vencidos DESC
        `;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Obtener municipios disponibles para filtros
    static async getMunicipalities() {
        const query = `
            SELECT DISTINCT municipio 
            FROM direccion 
            WHERE municipio IS NOT NULL 
            ORDER BY municipio
        `;
        const result = await pool.query(query);
        return result.rows.map(row => row.municipio);
    }

    // Obtener responsables disponibles
    static async getResponsibles() {
        const query = `
            SELECT u.id_usuario, u.nombre, u.usuario
            FROM usuario u
            INNER JOIN rol r ON u.rol_id = r.id_rol
            WHERE r.nombre_rol IN ('ASESOR', 'SUPERVISOR', 'GERENTE')
            ORDER BY u.nombre
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Obtener aliados disponibles
    static async getAliados() {
        const query = `
            SELECT id_aliado, nom_aliado
            FROM aliado
            ORDER BY nom_aliado
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Obtener estados de cartera para filtros
    static async getCarteraEstados() {
        return [
            { value: 'CARTERA VENCIDA', label: 'Cartera Vencida' },
            { value: 'CARTERA CORRIENTE', label: 'Cartera Corriente (con mora)' },
            { value: 'EN CURSO', label: 'En Curso (sin mora)' },
            { value: 'LIQUIDADO', label: 'Liquidado' },
            { value: 'REGULAR', label: 'Regular' }
        ];
    }
    // Obtener filtros de fecha por periodo
    static getFiltersByPeriod(periodo) {
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        let startDate = new Date();

        switch (periodo) {
            case 'semana':
                // Inicio de la semana (Lunes)
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                break;
            case 'mes':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'trimestre':
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterMonth, 1);
                break;
            case 'anio':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default: // mes por defecto
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate,
            periodo
        };
    }

    // Obtener estadísticas para el dashboard
    static async getDashboardStatistics(filters) {
        const { startDate, endDate } = filters;

        // Consultas básicas de indicadores financieros
        const query = `
            WITH metrics AS (
                SELECT 
                    -- Total ministrado en el periodo
                    COALESCE(SUM(CASE WHEN fecha_ministracion BETWEEN $1 AND $2 THEN total_capital ELSE 0 END), 0) as ministrado_periodo,
                    
                    -- Num créditos nuevos en el periodo
                    COUNT(CASE WHEN fecha_ministracion BETWEEN $1 AND $2 THEN id_credito END) as nuevos_creditos,
                    
                    -- Total cobrado (capital + interes) en el periodo base a fecha de pago real
                    (
                        SELECT COALESCE(SUM(capital + interes), 0)
                        FROM calendario_pago
                        WHERE fecha_pago BETWEEN $1 AND $2
                        AND pagado = true
                    ) as cobrado_total,
                    
                    -- Interés generado (cobrado) en el periodo
                    (
                        SELECT COALESCE(SUM(interes), 0)
                        FROM calendario_pago
                        WHERE fecha_pago BETWEEN $1 AND $2
                        AND pagado = true
                    ) as interes_cobrado,
                    
                    -- Mora cobrada en el periodo
                    (
                        SELECT COALESCE(SUM(mora_acumulada), 0)
                        FROM calendario_pago
                        WHERE fecha_pago BETWEEN $1 AND $2
                        AND pagado = true
                    ) as mora_cobrada

                FROM credito
                WHERE estado_credito != 'CANCELADO'
            )
            SELECT * FROM metrics
        `;

        const result = await pool.query(query, [startDate, endDate]);
        return result.rows[0];
    }

    static async getDashboardData(periodo) {
        console.log('Obteniendo datos del dashboard para periodo:', periodo);

        // Obtener fechas según el período
        const dateFilter = this.getPeriodoFilter(periodo);
        const params = [];

        let query = `
        WITH estadisticas_creditos AS (
            SELECT 
                c.id_credito,
                c.fecha_ministracion,
                c.total_capital,
                c.total_interes,
                c.total_a_pagar,
                c.saldo_pendiente,
                c.estado_credito,
                cl.nombre_cliente || ' ' || cl.app_cliente AS nombre_cliente,
                a.nom_aliado,
                u.nombre AS responsable,
                d.municipio,
                -- Calcular semanas transcurridas
                CEIL(DATE_PART('day', CURRENT_DATE - c.fecha_primer_pago) / 7) AS semanas_transcurridas,
                p.numero_pagos
            FROM credito c
            INNER JOIN solicitud s ON c.solicitud_id = s.id_solicitud
            INNER JOIN cliente cl ON s.cliente_id = cl.id_cliente
            INNER JOIN aliado a ON c.aliado_id = a.id_aliado
            INNER JOIN usuario u ON s.usuario_id = u.id_usuario
            INNER JOIN direccion d ON cl.direccion_id = d.id_direccion
            INNER JOIN pagare p ON c.id_credito = p.credito_id
            WHERE c.estado_credito = 'ENTREGADO'
    `;

        // Filtrar por período si aplica
        if (periodo && periodo !== 'personalizado' && dateFilter) {
            query += ` AND c.fecha_ministracion >= $${params.length + 1}`;
            params.push(dateFilter);
        }

        query += `
        ),
        pagos_info AS (
            SELECT 
                ec.id_credito,
                COUNT(cp.id_calendario) AS total_pagos,
                SUM(CASE WHEN cp.pagado = true THEN 1 ELSE 0 END) AS pagos_realizados,
                SUM(CASE WHEN cp.pagado = false AND cp.fecha_vencimiento < CURRENT_DATE THEN 1 ELSE 0 END) AS pagos_vencidos,
                COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.capital ELSE 0 END), 0) AS capital_pagado,
                COALESCE(SUM(CASE WHEN cp.pagado = true THEN cp.interes ELSE 0 END), 0) AS interes_pagado,
                COALESCE(SUM(cp.mora_acumulada), 0) AS mora_total
            FROM estadisticas_creditos ec
            LEFT JOIN calendario_pago cp ON cp.pagare_id = (
                SELECT id_pagare FROM pagare WHERE credito_id = ec.id_credito LIMIT 1
            )
            GROUP BY ec.id_credito
        ),
        estado_cartera AS (
            SELECT 
                ec.*,
                pi.total_pagos,
                pi.pagos_realizados,
                pi.pagos_vencidos,
                pi.capital_pagado,
                pi.interes_pagado,
                pi.mora_total,
                -- Determinar estado de cartera
                CASE 
                    WHEN ec.semanas_transcurridas > ec.numero_pagos 
                         AND pi.pagos_vencidos > 0 THEN 'CARTERA VENCIDA'
                    WHEN ec.semanas_transcurridas <= ec.numero_pagos 
                         AND pi.pagos_vencidos > 0 THEN 'CARTERA CORRIENTE'
                    WHEN ec.semanas_transcurridas > ec.numero_pagos 
                         AND pi.pagos_realizados = ec.numero_pagos THEN 'LIQUIDADO'
                    WHEN ec.semanas_transcurridas <= ec.numero_pagos 
                         AND pi.pagos_vencidos = 0 THEN 'EN CURSO'
                    ELSE 'REGULAR'
                END AS estado_cartera
            FROM estadisticas_creditos ec
            INNER JOIN pagos_info pi ON ec.id_credito = pi.id_credito
        )
        SELECT 
            id_credito,
            nombre_cliente,
            total_capital AS monto_credito,
            fecha_ministracion AS fecha_desembolso,
            estado_cartera,
            capital_pagado,
            mora_total,
            total_capital - capital_pagado AS saldo_capital,
            municipio,
            nom_aliado,
            responsable,
            semanas_transcurridas,
            numero_pagos,
            pagos_realizados,
            pagos_vencidos
        FROM estado_cartera
        ORDER BY 
            CASE estado_cartera 
                WHEN 'CARTERA VENCIDA' THEN 1
                WHEN 'CARTERA CORRIENTE' THEN 2
                WHEN 'EN CURSO' THEN 3
                ELSE 4
            END,
            fecha_ministracion DESC
        LIMIT 500
    `;

        try {
            console.log('Ejecutando query dashboard con params:', params);
            const result = await pool.query(query, params);
            console.log(`Datos obtenidos: ${result.rows.length} registros`);
            return result.rows;
        } catch (error) {
            console.error('Error en getDashboardData:', error);
            throw error;
        }
    }


}

module.exports = TreasuryModel; 