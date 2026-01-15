const TreasuryModel = require('../models/tesorera.model');
const ExcelService = require('../services/excel.service');
const PDFService = require('../services/pdf.service');

class TreasuryController {

    // Obtener reporte de ministraciones (se mantiene igual)
    static async getMinistrationsReport(req, res) {
        try {
            const filters = req.query;
            const data = await TreasuryModel.getMinistrationsReport(filters);

            const format = req.query.format || 'json';

            if (format === 'excel') {
                const excelBuffer = await ExcelService.generateMinistrationsReport(data);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=reporte_ministraciones.xlsx');
                return res.send(excelBuffer);
            }

            if (format === 'pdf') {
                const pdfBuffer = await PDFService.generateMinistrationsReport(data, filters);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=reporte_ministraciones.pdf');
                return res.send(pdfBuffer);
            }

            res.json({
                success: true,
                data: data,
                total: data.length
            });

        } catch (error) {
            console.error('Error en reporte de ministraciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar el reporte',
                error: error.message
            });
        }
    }

    // Obtener reporte de capital y cartera (CORREGIDO)
    static async getCapitalReport(req, res) {
        try {
            const filters = req.query;
            const data = await TreasuryModel.getCapitalReport(filters);

            // Calcular totales por tipo de cartera
            const totals = data.reduce((acc, item) => {
                acc.totalCapital += parseFloat(item.total_capital) || 0;
                acc.saldoPendiente += parseFloat(item.saldo_total_pendiente) || 0;
                acc.mora += parseFloat(item.mora_acumulada_total) || 0;

                // Agrupar por estado de cartera
                if (item.estado_cartera === 'CARTERA VENCIDA') {
                    acc.vencidoCapital += parseFloat(item.saldo_capital) || 0;
                    acc.vencidoCount++;
                } else if (item.estado_cartera === 'CARTERA CORRIENTE') {
                    acc.corrienteCapital += parseFloat(item.saldo_capital) || 0;
                    acc.corrienteCount++;
                } else if (item.estado_cartera === 'EN CURSO') {
                    acc.enCursoCapital += parseFloat(item.saldo_capital) || 0;
                    acc.enCursoCount++;
                } else if (item.estado_cartera === 'LIQUIDADO') {
                    acc.liquidadoCount++;
                }

                return acc;
            }, {
                totalCapital: 0,
                saldoPendiente: 0,
                mora: 0,
                vencidoCapital: 0,
                vencidoCount: 0,
                corrienteCapital: 0,
                corrienteCount: 0,
                enCursoCapital: 0,
                enCursoCount: 0,
                liquidadoCount: 0
            });

            const format = req.query.format || 'json';

            if (format === 'excel') {
                const excelBuffer = await ExcelService.generateCapitalReport(data, totals);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=reporte_capital_cartera.xlsx');
                return res.send(excelBuffer);
            }

            if (format === 'pdf') {
                const pdfBuffer = await PDFService.generateCapitalReport(data, totals, filters);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=reporte_capital_cartera.pdf');
                return res.send(pdfBuffer);
            }

            res.json({
                success: true,
                data: data,
                totals: totals,
                summary: {
                    totalCreditos: data.length,
                    carteraVencida: {
                        cantidad: totals.vencidoCount,
                        monto: totals.vencidoCapital,
                        porcentaje: ((totals.vencidoCount / data.length) * 100).toFixed(2),
                        //interesesGenerados: ((totals.vencidoCapital * ))
                    },
                    carteraCorrienteMora: {
                        cantidad: totals.corrienteCount,
                        monto: totals.corrienteCapital,
                        porcentaje: ((totals.corrienteCount / data.length) * 100).toFixed(2)
                    },
                    carteraEnCurso: {
                        cantidad: totals.enCursoCount,
                        monto: totals.enCursoCapital,
                        porcentaje: ((totals.enCursoCount / data.length) * 100).toFixed(2)
                    }
                }
            });

        } catch (error) {
            console.error('Error en reporte de capital:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar el reporte',
                error: error.message
            });
        }
    }

    // Obtener detalle de pagos
    static async getPaymentDetailReport(req, res) {
        try {
            const filters = req.query;
            const data = await TreasuryModel.getPaymentDetailReport(filters);

            const format = req.query.format || 'json';

            if (format === 'excel') {
                const excelBuffer = await ExcelService.generatePaymentDetailReport(data);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=detalle_pagos.xlsx');
                return res.send(excelBuffer);
            }

            res.json({
                success: true,
                data: data,
                summary: {
                    totalPagos: data.length,
                    pagosVencidos: data.filter(p => p.dias_atraso > 0).length,
                    pagosPendientes: data.filter(p => !p.pagado && p.dias_atraso === 0).length,
                    pagosPagados: data.filter(p => p.pagado).length,
                    moraTotal: data.reduce((sum, p) => sum + parseFloat(p.mora_acumulada), 0)
                }
            });

        } catch (error) {
            console.error('Error en reporte de pagos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar el reporte',
                error: error.message
            });
        }
    }

    // Obtener resumen de cartera
    static async getPortfolioSummary(req, res) {
        try {
            const filters = req.query;
            const data = await TreasuryModel.getPortfolioSummary(filters);

            res.json({
                success: true,
                data: data,
                totals: data.reduce((acc, item) => {
                    acc.totalCreditos += parseInt(item.total_creditos) || 0;
                    acc.carteraVencida += parseInt(item.creditos_vencidos) || 0;
                    acc.carteraCorriente += parseInt(item.creditos_corrientes_mora) || 0;
                    acc.moraTotal += parseFloat(item.mora_total) || 0;
                    return acc;
                }, { totalCreditos: 0, carteraVencida: 0, carteraCorriente: 0, moraTotal: 0, totalClientes: 0 })
            });

        } catch (error) {
            console.error('Error en resumen de cartera:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar el reporte',
                error: error.message
            });
        }
    }

    // Obtener opciones de filtro
    static async getFilterOptions(req, res) {
        try {
            const [municipalities, responsibles, aliados, carteraEstados] = await Promise.all([
                TreasuryModel.getMunicipalities(),
                TreasuryModel.getResponsibles(),
                TreasuryModel.getAliados(),
                TreasuryModel.getCarteraEstados()
            ]);

            res.json({
                success: true,
                data: {
                    municipalities,
                    responsibles,
                    aliados,
                    carteraEstados,
                    estadosCredito: ['PENDIENTE', 'ENTREGADO', 'DEVOLUCION', 'CANCELADO'],
                    estadosPago: ['VENCIDO', 'PENDIENTE', 'PAGADO']
                }
            });

        } catch (error) {
            console.error('Error obteniendo opciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener opciones de filtro',
                error: error.message
            });
        }
    }

}

module.exports = TreasuryController;