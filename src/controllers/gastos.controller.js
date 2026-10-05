const pool = require('../config/db');

// ============================================================
// OBTENER CATÁLOGO DE CATEGORÍAS DE GASTO
// ============================================================
const obtenerCategorias = async (req, res) => {
    try {
        const query = `
            SELECT id_categoria_gasto, nombre, descripcion, activo
            FROM public.categoria_gasto
            WHERE activo = true
            ORDER BY nombre ASC
        `;
        const result = await pool.query(query);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error al obtener categorías de gasto:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener categorías',
            detalle: error.message
        });
    }
};

// ============================================================
// CREAR NUEVA CATEGORÍA DE GASTO
// ============================================================
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El nombre de la categoría es obligatorio'
            });
        }

        const query = `
            INSERT INTO public.categoria_gasto (nombre, descripcion)
            VALUES ($1, $2)
            ON CONFLICT (nombre) DO UPDATE SET activo = true
            RETURNING *
        `;
        const result = await pool.query(query, [nombre.trim(), descripcion ? descripcion.trim() : null]);

        res.status(201).json({
            success: true,
            message: 'Categoría creada o reactivada correctamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear categoría de gasto:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al crear categoría',
            detalle: error.message
        });
    }
};

// ============================================================
// OBTENER LISTADO DE GASTOS CON FILTROS Y TOTALES
// ============================================================
const obtenerGastos = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            fecha_inicio,
            fecha_fin,
            periodo,
            categoria_id,
            metodo_pago,
            estatus,
            busqueda
        } = req.query;

        let conditions = [];
        let params = [];
        let paramIndex = 1;

        // Filtro por rango de fechas explícito
        if (fecha_inicio) {
            conditions.push(`g.fecha_gasto >= $${paramIndex}::date`);
            params.push(fecha_inicio);
            paramIndex++;
        }

        if (fecha_fin) {
            conditions.push(`g.fecha_gasto <= $${paramIndex}::date`);
            params.push(fecha_fin);
            paramIndex++;
        }

        // Filtro por período relativo (si no se enviaron fechas explícitas)
        if (!fecha_inicio && !fecha_fin && periodo) {
            const p = periodo.toLowerCase();
            if (p === 'hoy') {
                conditions.push(`g.fecha_gasto = CURRENT_DATE`);
            } else if (p === 'semana') {
                conditions.push(`g.fecha_gasto >= date_trunc('week', CURRENT_DATE)::date`);
                conditions.push(`g.fecha_gasto < (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')::date`);
            } else if (p === 'quincena') {
                conditions.push(`
                    (
                        (EXTRACT(DAY FROM CURRENT_DATE) <= 15 
                            AND g.fecha_gasto >= date_trunc('month', CURRENT_DATE)::date 
                            AND g.fecha_gasto < (date_trunc('month', CURRENT_DATE) + INTERVAL '15 days')::date)
                        OR
                        (EXTRACT(DAY FROM CURRENT_DATE) > 15 
                            AND g.fecha_gasto >= (date_trunc('month', CURRENT_DATE) + INTERVAL '15 days')::date 
                            AND g.fecha_gasto < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date)
                    )
                `);
            } else if (p === 'mes') {
                conditions.push(`g.fecha_gasto >= date_trunc('month', CURRENT_DATE)::date`);
                conditions.push(`g.fecha_gasto < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date`);
            }
        }

        // Filtro por categoría
        if (categoria_id) {
            conditions.push(`g.categoria_id = $${paramIndex}`);
            params.push(Number(categoria_id));
            paramIndex++;
        }

        // Filtro por método de pago
        if (metodo_pago && metodo_pago.trim()) {
            conditions.push(`LOWER(g.metodo_pago) = LOWER($${paramIndex})`);
            params.push(metodo_pago.trim());
            paramIndex++;
        }

        // Filtro por estatus
        if (estatus && estatus.trim()) {
            conditions.push(`g.estatus = $${paramIndex}`);
            params.push(estatus.trim());
            paramIndex++;
        }

        // Búsqueda por texto (concepto, descripción o referencia)
        if (busqueda && busqueda.trim()) {
            conditions.push(`(
                LOWER(g.concepto) LIKE LOWER($${paramIndex}) OR
                LOWER(COALESCE(g.descripcion, '')) LIKE LOWER($${paramIndex}) OR
                LOWER(COALESCE(g.referencia, '')) LIKE LOWER($${paramIndex})
            )`);
            params.push(`%${busqueda.trim()}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                g.id_gasto,
                g.categoria_id,
                c.nombre AS categoria_nombre,
                g.concepto,
                g.descripcion,
                g.monto::numeric AS monto,
                g.fecha_gasto,
                g.metodo_pago,
                g.referencia,
                g.comprobante,
                g.registrado_por,
                u.nombre AS registrado_por_nombre,
                g.fecha_registro,
                g.estatus
            FROM public.gasto g
            JOIN public.categoria_gasto c ON c.id_categoria_gasto = g.categoria_id
            LEFT JOIN public.usuario u ON u.id_usuario = g.registrado_por
            ${whereClause}
            ORDER BY g.fecha_gasto DESC, g.id_gasto DESC
        `;

        const result = await client.query(query, params);

        // Calcular totales
        let total_gastos = 0;
        const categoriaTotales = {};

        result.rows.forEach(row => {
            const monto = Number(row.monto) || 0;
            if (row.estatus !== 'CANCELADO') {
                total_gastos += monto;
                if (!categoriaTotales[row.categoria_nombre]) {
                    categoriaTotales[row.categoria_nombre] = { total: 0, cantidad: 0 };
                }
                categoriaTotales[row.categoria_nombre].total += monto;
                categoriaTotales[row.categoria_nombre].cantidad += 1;
            }
        });

        // Convertir desglose por categoría a arreglo ordenado por mayor gasto
        const por_categoria = Object.entries(categoriaTotales)
            .map(([nombre, data]) => ({
                categoria: nombre,
                total: data.total,
                cantidad: data.cantidad
            }))
            .sort((a, b) => b.total - a.total);

        res.status(200).json({
            success: true,
            message: 'Gastos obtenidos correctamente',
            totales: {
                total_gastos,
                cantidad_gastos: result.rows.length,
                categoria_principal: por_categoria.length > 0 ? por_categoria[0].categoria : 'Ninguna',
                por_categoria
            },
            data: result.rows
        });

    } catch (error) {
        console.error('Error al obtener gastos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al obtener gastos',
            detalle: error.message
        });
    } finally {
        client.release();
    }
};

// ============================================================
// REGISTRAR UN NUEVO GASTO
// ============================================================
const crearGasto = async (req, res) => {
    try {
        const {
            categoria_id,
            concepto,
            descripcion,
            monto,
            fecha_gasto,
            metodo_pago,
            referencia,
            comprobante,
            registrado_por,
            estatus
        } = req.body;

        // Validaciones
        if (!categoria_id) {
            return res.status(400).json({ success: false, error: 'La categoría del gasto es obligatoria' });
        }
        if (!concepto || !concepto.trim()) {
            return res.status(400).json({ success: false, error: 'El concepto del gasto es obligatorio' });
        }
        const montoNum = Number(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            return res.status(400).json({ success: false, error: 'El monto debe ser un número mayor a 0' });
        }

        const insertQuery = `
            INSERT INTO public.gasto (
                categoria_id,
                concepto,
                descripcion,
                monto,
                fecha_gasto,
                metodo_pago,
                referencia,
                comprobante,
                registrado_por,
                estatus
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                COALESCE($5::date, CURRENT_DATE),
                COALESCE($6, 'EFECTIVO'),
                $7,
                $8,
                $9,
                COALESCE($10, 'PAGADO')
            )
            RETURNING *
        `;

        const values = [
            Number(categoria_id),
            concepto.trim(),
            descripcion ? descripcion.trim() : null,
            montoNum,
            fecha_gasto || null,
            metodo_pago || 'EFECTIVO',
            referencia ? referencia.trim() : null,
            comprobante ? comprobante.trim() : null,
            registrado_por ? Number(registrado_por) : null,
            estatus || 'PAGADO'
        ];

        const result = await pool.query(insertQuery, values);
        const nuevoGasto = result.rows[0];

        // Obtener datos complementarios (nombre de categoría y de usuario)
        const detalleQuery = `
            SELECT 
                g.id_gasto,
                g.categoria_id,
                c.nombre AS categoria_nombre,
                g.concepto,
                g.descripcion,
                g.monto::numeric AS monto,
                g.fecha_gasto,
                g.metodo_pago,
                g.referencia,
                g.comprobante,
                g.registrado_por,
                u.nombre AS registrado_por_nombre,
                g.fecha_registro,
                g.estatus
            FROM public.gasto g
            JOIN public.categoria_gasto c ON c.id_categoria_gasto = g.categoria_id
            LEFT JOIN public.usuario u ON u.id_usuario = g.registrado_por
            WHERE g.id_gasto = $1
        `;
        const detalleResult = await pool.query(detalleQuery, [nuevoGasto.id_gasto]);

        res.status(201).json({
            success: true,
            message: 'Gasto registrado correctamente',
            data: detalleResult.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar gasto:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al registrar el gasto',
            detalle: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR UN GASTO EXISTENTE
// ============================================================
const actualizarGasto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            categoria_id,
            concepto,
            descripcion,
            monto,
            fecha_gasto,
            metodo_pago,
            referencia,
            comprobante,
            estatus
        } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, error: 'ID de gasto no proporcionado' });
        }

        const montoNum = monto !== undefined ? Number(monto) : undefined;
        if (montoNum !== undefined && (isNaN(montoNum) || montoNum <= 0)) {
            return res.status(400).json({ success: false, error: 'El monto debe ser un número mayor a 0' });
        }

        const updateQuery = `
            UPDATE public.gasto
            SET 
                categoria_id = COALESCE($1, categoria_id),
                concepto = COALESCE($2, concepto),
                descripcion = COALESCE($3, descripcion),
                monto = COALESCE($4, monto),
                fecha_gasto = COALESCE($5::date, fecha_gasto),
                metodo_pago = COALESCE($6, metodo_pago),
                referencia = COALESCE($7, referencia),
                comprobante = COALESCE($8, comprobante),
                estatus = COALESCE($9, estatus)
            WHERE id_gasto = $10
            RETURNING *
        `;

        const values = [
            categoria_id ? Number(categoria_id) : null,
            concepto ? concepto.trim() : null,
            descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : null,
            montoNum || null,
            fecha_gasto || null,
            metodo_pago || null,
            referencia !== undefined ? (referencia ? referencia.trim() : null) : null,
            comprobante !== undefined ? (comprobante ? comprobante.trim() : null) : null,
            estatus || null,
            Number(id)
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        }

        // Obtener detalle completo
        const detalleQuery = `
            SELECT 
                g.id_gasto,
                g.categoria_id,
                c.nombre AS categoria_nombre,
                g.concepto,
                g.descripcion,
                g.monto::numeric AS monto,
                g.fecha_gasto,
                g.metodo_pago,
                g.referencia,
                g.comprobante,
                g.registrado_por,
                u.nombre AS registrado_por_nombre,
                g.fecha_registro,
                g.estatus
            FROM public.gasto g
            JOIN public.categoria_gasto c ON c.id_categoria_gasto = g.categoria_id
            LEFT JOIN public.usuario u ON u.id_usuario = g.registrado_por
            WHERE g.id_gasto = $1
        `;
        const detalleResult = await pool.query(detalleQuery, [id]);

        res.status(200).json({
            success: true,
            message: 'Gasto actualizado correctamente',
            data: detalleResult.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar gasto:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al actualizar el gasto',
            detalle: error.message
        });
    }
};

// ============================================================
// ELIMINAR O CANCELAR UN GASTO
// ============================================================
const eliminarGasto = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, error: 'ID de gasto no proporcionado' });
        }

        const deleteQuery = `DELETE FROM public.gasto WHERE id_gasto = $1 RETURNING *`;
        const result = await pool.query(deleteQuery, [Number(id)]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Gasto eliminado correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error al eliminar gasto:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al eliminar el gasto',
            detalle: error.message
        });
    }
};

module.exports = {
    obtenerCategorias,
    crearCategoria,
    obtenerGastos,
    crearGasto,
    actualizarGasto,
    eliminarGasto
};
