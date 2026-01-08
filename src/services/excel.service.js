// const ExcelJS = require('exceljs');

// class ExcelService {
// <<<<<<< HEAD
    
//     static async generateMinistrationsReport(data) {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Ministraciones');
        
// =======

//     static async generateMinistrationsReport(data) {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Ministraciones');

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Estilos
//         const headerStyle = {
//             fill: {
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: { argb: 'FF4472C4' }
//             },
//             font: {
//                 color: { argb: 'FFFFFFFF' },
//                 bold: true
//             },
//             border: {
//                 top: { style: 'thin' },
//                 left: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 right: { style: 'thin' }
//             }
//         };
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Encabezados
//         worksheet.columns = [
//             { header: 'ID Crédito', key: 'id_credito', width: 15 },
//             { header: 'Fecha Ministración', key: 'fecha_ministracion', width: 20 },
//             { header: 'Cliente', key: 'cliente_nombre', width: 30 },
//             { header: 'Aliado', key: 'nom_aliado', width: 20 },
//             { header: 'Responsable', key: 'responsable', width: 25 },
//             { header: 'Municipio', key: 'municipio', width: 20 },
//             { header: 'Capital', key: 'total_capital', width: 15, style: { numFmt: '$#,##0.00' } },
//             { header: 'Interés', key: 'total_interes', width: 15, style: { numFmt: '$#,##0.00' } },
//             { header: 'Total a Pagar', key: 'total_a_pagar', width: 15, style: { numFmt: '$#,##0.00' } },
//             { header: 'Estado', key: 'estado_credito', width: 15 },
//             { header: 'Referencia Bancaria', key: 'referencia_bancaria', width: 25 },
//             { header: 'Cuenta Bancaria', key: 'cuenta_bancaria', width: 20 }
//         ];
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Aplicar estilo a encabezados
//         worksheet.getRow(1).eachCell((cell) => {
//             cell.style = headerStyle;
//         });
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Agregar datos
//         data.forEach((item, index) => {
//             worksheet.addRow(item);
//         });
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Agregar fila de totales
//         const totalRow = worksheet.addRow({});
//         totalRow.getCell('F').value = 'TOTAL:';
//         totalRow.getCell('F').style = { font: { bold: true } };
// <<<<<<< HEAD
        
//         const totalCapital = data.reduce((sum, item) => sum + (parseFloat(item.total_capital) || 0), 0);
//         const totalInteres = data.reduce((sum, item) => sum + (parseFloat(item.total_interes) || 0), 0);
//         const totalPagar = data.reduce((sum, item) => sum + (parseFloat(item.total_a_pagar) || 0), 0);
        
// =======

//         const totalCapital = data.reduce((sum, item) => sum + (parseFloat(item.total_capital) || 0), 0);
//         const totalInteres = data.reduce((sum, item) => sum + (parseFloat(item.total_interes) || 0), 0);
//         const totalPagar = data.reduce((sum, item) => sum + (parseFloat(item.total_a_pagar) || 0), 0);

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         totalRow.getCell('G').value = totalCapital;
//         totalRow.getCell('G').style = { numFmt: '$#,##0.00', font: { bold: true } };
//         totalRow.getCell('H').value = totalInteres;
//         totalRow.getCell('H').style = { numFmt: '$#,##0.00', font: { bold: true } };
//         totalRow.getCell('I').value = totalPagar;
//         totalRow.getCell('I').style = { numFmt: '$#,##0.00', font: { bold: true } };
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Generar buffer
//         const buffer = await workbook.xlsx.writeBuffer();
//         return buffer;
//     }
// <<<<<<< HEAD
    
//     static async generateCapitalReport(data, totals) {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Capital y Cartera');
        
// =======

//     static async generateCapitalReport(data, totals) {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Capital y Cartera');

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Estilos
//         const headerStyle = {
//             fill: {
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: { argb: 'FF4472C4' }
//             },
//             font: {
//                 color: { argb: 'FFFFFFFF' },
//                 bold: true
//             },
//             border: {
//                 top: { style: 'thin' },
//                 left: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 right: { style: 'thin' }
//             }
//         };
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         const totalStyle = {
//             fill: {
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: { argb: 'FFF2F2F2' }
//             },
//             font: {
//                 bold: true
//             },
//             border: {
//                 top: { style: 'thin' },
//                 left: { style: 'thin' },
//                 bottom: { style: 'thin' },
//                 right: { style: 'thin' }
//             }
//         };
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Encabezados
//         worksheet.columns = [
//             { header: 'ID Crédito', key: 'id_credito', width: 15 },
//             { header: 'Estado', key: 'estado_credito', width: 15 },
//             { header: 'Fecha', key: 'fecha_ministracion', width: 20 },
//             { header: 'Cliente', key: 'cliente_nombre', width: 30 },
//             { header: 'Aliado', key: 'nom_aliado', width: 20 },
//             { header: 'Municipio', key: 'municipio', width: 20 },
//             { header: 'Capital', key: 'total_capital', width: 15, style: { numFmt: '$#,##0.00' } },
//             { header: 'Saldo Pendiente', key: 'saldo_pendiente', width: 15, style: { numFmt: '$#,##0.00' } },
//             { header: 'Cartera Vigente', key: 'cartera_vigente', width: 15, style: { numFmt: '$#,##0.00' } },
//             { header: 'Cartera Vencida', key: 'cartera_vencida', width: 15, style: { numFmt: '$#,##0.00' } },
//             { header: 'Mora Acumulada', key: 'mora_acumulada', width: 15, style: { numFmt: '$#,##0.00' } }
//         ];
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Aplicar estilo a encabezados
//         worksheet.getRow(1).eachCell((cell) => {
//             cell.style = headerStyle;
//         });
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Agregar datos
//         data.forEach((item) => {
//             worksheet.addRow(item);
//         });
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Agregar resumen
//         const summaryRow = worksheet.addRow({});
//         summaryRow.getCell('A').value = 'RESUMEN DE CARTERA';
//         summaryRow.getCell('A').style = { font: { bold: true, size: 14 }, alignment: { horizontal: 'center' } };
//         worksheet.mergeCells('A1:K1');
// <<<<<<< HEAD
        
// =======

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Agregar totales
//         const totalRow = worksheet.addRow({
//             total_capital: totals.totalCapital,
//             cartera_vigente: totals.vigente,
//             cartera_vencida: totals.vencida,
//             mora_acumulada: totals.mora
//         });
// <<<<<<< HEAD
        
//         totalRow.getCell('F').value = 'TOTALES:';
//         totalRow.getCell('F').style = totalStyle;
        
//         ['G', 'H', 'I', 'J', 'K'].forEach(cell => {
//             if (totalRow.getCell(cell).value) {
//                 totalRow.getCell(cell).style = { 
//                     ...totalStyle, 
//                     numFmt: '$#,##0.00' 
//                 };
//             }
//         });
        
// =======

//         totalRow.getCell('F').value = 'TOTALES:';
//         totalRow.getCell('F').style = totalStyle;

//         ['G', 'H', 'I', 'J', 'K'].forEach(cell => {
//             if (totalRow.getCell(cell).value) {
//                 totalRow.getCell(cell).style = {
//                     ...totalStyle,
//                     numFmt: '$#,##0.00'
//                 };
//             }
//         });

// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
//         // Generar buffer
//         const buffer = await workbook.xlsx.writeBuffer();
//         return buffer;
//     }
// <<<<<<< HEAD
// =======

//     static async generateDashboardReport(data, period) {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Resumen Dashboard');

//         // Estilos
//         const headerStyle = {
//             fill: {
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: { argb: 'FF4472C4' }
//             },
//             font: {
//                 color: { argb: 'FFFFFFFF' },
//                 bold: true,
//                 size: 14
//             },
//             alignment: { horizontal: 'center' }
//         };

//         // Título
//         worksheet.mergeCells('A1:C1');
//         worksheet.getCell('A1').value = `REPORTE FINANCIERO - PERIODO: ${period.toUpperCase()}`;
//         worksheet.getCell('A1').style = headerStyle;

//         worksheet.getColumn('A').width = 30;
//         worksheet.getColumn('B').width = 20;

//         // Datos
//         const rows = [
//             ['Concepto', 'Monto / Cantidad'],
//             ['Total Ministrado', data.ministrado_periodo],
//             ['Nuevos Créditos', data.nuevos_creditos],
//             ['Total Cobrado', data.cobrado_total],
//             ['Intereses Cobrados', data.interes_cobrado],
//             ['Mora Cobrada', data.mora_cobrada]
//         ];

//         let currentRow = 3;

//         rows.forEach((row, index) => {
//             const r = worksheet.getRow(currentRow);
//             r.values = row;

//             if (index === 0) {
//                 // Sub encabezado
//                 r.font = { bold: true };
//                 r.getCell(1).style = {
//                     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
//                     border: { bottom: { style: 'thin' } }
//                 };
//                 r.getCell(2).style = {
//                     fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
//                     border: { bottom: { style: 'thin' } }
//                 };
//             } else {
//                 // Formato de moneda para valores monetarios
//                 if (typeof row[1] === 'number' && index !== 2) { // index 2 es cantidad de créditos
//                     r.getCell(2).numFmt = '$#,##0.00';
//                 }
//             }
//             currentRow++;
//         });

//         return await workbook.xlsx.writeBuffer();
//     }

//     // Generar reporte de dashboard
//     static async generateDashboardReport(data, periodo) {
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Dashboard');

//         // Estilos
//         const headerStyle = {
//             font: { bold: true, color: { argb: 'FFFFFF' } },
//             fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } },
//             alignment: { horizontal: 'center' }
//         };

//         // Título
//         worksheet.mergeCells('A1:G1');
//         const titleCell = worksheet.getCell('A1');
//         titleCell.value = `Reporte de Dashboard - ${periodo}`;
//         titleCell.font = { size: 16, bold: true };
//         titleCell.alignment = { horizontal: 'center' };

//         // Encabezados
//         const headers = [
//             'ID Crédito', 'Cliente', 'Monto', 'Fecha Desembolso',
//             'Estado Cartera', 'Capital Pagado', 'Mora Total'
//         ];

//         worksheet.addRow(headers);
//         const headerRow = worksheet.getRow(3);
//         headerRow.eachCell((cell) => {
//             cell.style = headerStyle;
//         });

//         // Datos
//         data.forEach(item => {
//             worksheet.addRow([
//                 item.id_credito,
//                 item.nombre_cliente,
//                 item.monto_credito,
//                 item.fecha_desembolso,
//                 item.estado_cartera,
//                 item.capital_pagado,
//                 item.mora_total
//             ]);
//         });

//         // Ajustar ancho de columnas
//         worksheet.columns = [
//             { width: 15 },
//             { width: 30 },
//             { width: 15 },
//             { width: 20 },
//             { width: 20 },
//             { width: 15 },
//             { width: 15 }
//         ];

//         // Agregar totales
//         const totalRow = worksheet.addRow([]);
//         const totals = {
//             monto_total: data.reduce((sum, item) => sum + parseFloat(item.monto_credito || 0), 0),
//             capital_total: data.reduce((sum, item) => sum + parseFloat(item.capital_pagado || 0), 0),
//             mora_total: data.reduce((sum, item) => sum + parseFloat(item.mora_total || 0), 0)
//         };

//         worksheet.addRow(['TOTALES', '', totals.monto_total, '', '', totals.capital_total, totals.mora_total]);

//         // Estilo para totales
//         const totalsRow = worksheet.lastRow;
//         totalsRow.font = { bold: true };
//         totalsRow.fill = {
//             type: 'pattern',
//             pattern: 'solid',
//             fgColor: { argb: 'F2F2F2' }
//         };

//         // Generar buffer
//         return await workbook.xlsx.writeBuffer();
//     }
// >>>>>>> 6719fdc226402dea9d76d297cb45ddc25371551f
// }

// module.exports = ExcelService;
const ExcelJS = require('exceljs');

class ExcelService {

    static async generateMinistrationsReport(data) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ministraciones');

        // Estilos
        const headerStyle = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            },
            font: {
                color: { argb: 'FFFFFFFF' },
                bold: true
            },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        // Encabezados
        worksheet.columns = [
            { header: 'ID Crédito', key: 'id_credito', width: 15 },
            { header: 'Fecha Ministración', key: 'fecha_ministracion', width: 20 },
            { header: 'Cliente', key: 'cliente_nombre', width: 30 },
            { header: 'Aliado', key: 'nom_aliado', width: 20 },
            { header: 'Responsable', key: 'responsable', width: 25 },
            { header: 'Municipio', key: 'municipio', width: 20 },
            { header: 'Capital', key: 'total_capital', width: 15, style: { numFmt: '$#,##0.00' } },
            { header: 'Interés', key: 'total_interes', width: 15, style: { numFmt: '$#,##0.00' } },
            { header: 'Total a Pagar', key: 'total_a_pagar', width: 15, style: { numFmt: '$#,##0.00' } },
            { header: 'Estado', key: 'estado_credito', width: 15 },
            { header: 'Referencia Bancaria', key: 'referencia_bancaria', width: 25 },
            { header: 'Cuenta Bancaria', key: 'cuenta_bancaria', width: 20 }
        ];

        // Aplicar estilo a encabezados
        worksheet.getRow(1).eachCell((cell) => {
            cell.style = headerStyle;
        });

        // Agregar datos
        data.forEach((item, index) => {
            worksheet.addRow(item);
        });

        // Agregar fila de totales
        const totalRow = worksheet.addRow({});
        totalRow.getCell('F').value = 'TOTAL:';
        totalRow.getCell('F').style = { font: { bold: true } };

        const totalCapital = data.reduce((sum, item) => sum + (parseFloat(item.total_capital) || 0), 0);
        const totalInteres = data.reduce((sum, item) => sum + (parseFloat(item.total_interes) || 0), 0);
        const totalPagar = data.reduce((sum, item) => sum + (parseFloat(item.total_a_pagar) || 0), 0);

        totalRow.getCell('G').value = totalCapital;
        totalRow.getCell('G').style = { numFmt: '$#,##0.00', font: { bold: true } };
        totalRow.getCell('H').value = totalInteres;
        totalRow.getCell('H').style = { numFmt: '$#,##0.00', font: { bold: true } };
        totalRow.getCell('I').value = totalPagar;
        totalRow.getCell('I').style = { numFmt: '$#,##0.00', font: { bold: true } };

        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    static async generateCapitalReport(data, totals) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Capital y Cartera');

        // Estilos
        const headerStyle = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            },
            font: {
                color: { argb: 'FFFFFFFF' },
                bold: true
            },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        const totalStyle = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' }
            },
            font: {
                bold: true
            },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        // Encabezados
        worksheet.columns = [
            { header: 'ID Crédito', key: 'id_credito', width: 15 },
            { header: 'Estado', key: 'estado_credito', width: 15 },
            { header: 'Fecha', key: 'fecha_ministracion', width: 20 },
            { header: 'Cliente', key: 'cliente_nombre', width: 30 },
            { header: 'Aliado', key: 'nom_aliado', width: 20 },
            { header: 'Municipio', key: 'municipio', width: 20 },
            { header: 'Capital', key: 'total_capital', width: 15, style: { numFmt: '$#,##0.00' } },
            { header: 'Saldo Pendiente', key: 'saldo_pendiente', width: 15, style: { numFmt: '$#,##0.00' } },
            { header: 'Cartera Vigente', key: 'cartera_vigente', width: 15, style: { numFmt: '$#,##0.00' } },
            { header: 'Cartera Vencida', key: 'cartera_vencida', width: 15, style: { numFmt: '$#,##0.00' } },
            { header: 'Mora Acumulada', key: 'mora_acumulada', width: 15, style: { numFmt: '$#,##0.00' } }
        ];

        // Aplicar estilo a encabezados
        worksheet.getRow(1).eachCell((cell) => {
            cell.style = headerStyle;
        });

        // Agregar datos
        data.forEach((item) => {
            worksheet.addRow(item);
        });

        // Agregar resumen
        const summaryRow = worksheet.addRow({});
        summaryRow.getCell('A').value = 'RESUMEN DE CARTERA';
        summaryRow.getCell('A').style = { font: { bold: true, size: 14 }, alignment: { horizontal: 'center' } };
        worksheet.mergeCells('A1:K1');

        // Agregar totales
        const totalRow = worksheet.addRow({
            total_capital: totals.totalCapital,
            cartera_vigente: totals.vigente,
            cartera_vencida: totals.vencida,
            mora_acumulada: totals.mora
        });

        totalRow.getCell('F').value = 'TOTALES:';
        totalRow.getCell('F').style = totalStyle;

        ['G', 'H', 'I', 'J', 'K'].forEach(cell => {
            if (totalRow.getCell(cell).value) {
                totalRow.getCell(cell).style = {
                    ...totalStyle,
                    numFmt: '$#,##0.00'
                };
            }
        });

        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    static async generateDashboardReport(data, period) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resumen Dashboard');

        // Estilos
        const headerStyle = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            },
            font: {
                color: { argb: 'FFFFFFFF' },
                bold: true,
                size: 14
            },
            alignment: { horizontal: 'center' }
        };

        // Título
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = `REPORTE FINANCIERO - PERIODO: ${period.toUpperCase()}`;
        worksheet.getCell('A1').style = headerStyle;

        worksheet.getColumn('A').width = 30;
        worksheet.getColumn('B').width = 20;

        // Datos
        const rows = [
            ['Concepto', 'Monto / Cantidad'],
            ['Total Ministrado', data.ministrado_periodo],
            ['Nuevos Créditos', data.nuevos_creditos],
            ['Total Cobrado', data.cobrado_total],
            ['Intereses Cobrados', data.interes_cobrado],
            ['Mora Cobrada', data.mora_cobrada]
        ];

        let currentRow = 3;

        rows.forEach((row, index) => {
            const r = worksheet.getRow(currentRow);
            r.values = row;

            if (index === 0) {
                // Sub encabezado
                r.font = { bold: true };
                r.getCell(1).style = {
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
                    border: { bottom: { style: 'thin' } }
                };
                r.getCell(2).style = {
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
                    border: { bottom: { style: 'thin' } }
                };
            } else {
                // Formato de moneda para valores monetarios
                if (typeof row[1] === 'number' && index !== 2) { // index 2 es cantidad de créditos
                    r.getCell(2).numFmt = '$#,##0.00';
                }
            }
            currentRow++;
        });

        return await workbook.xlsx.writeBuffer();
    }

    // Generar reporte de dashboard
    static async generateDashboardReport(data, periodo) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Dashboard');

        // Estilos
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } },
            alignment: { horizontal: 'center' }
        };

        // Título
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Reporte de Dashboard - ${periodo}`;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };

        // Encabezados
        const headers = [
            'ID Crédito', 'Cliente', 'Monto', 'Fecha Desembolso',
            'Estado Cartera', 'Capital Pagado', 'Mora Total'
        ];

        worksheet.addRow(headers);
        const headerRow = worksheet.getRow(3);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });

        // Datos
        data.forEach(item => {
            worksheet.addRow([
                item.id_credito,
                item.nombre_cliente,
                item.monto_credito,
                item.fecha_desembolso,
                item.estado_cartera,
                item.capital_pagado,
                item.mora_total
            ]);
        });

        // Ajustar ancho de columnas
        worksheet.columns = [
            { width: 15 },
            { width: 30 },
            { width: 15 },
            { width: 20 },
            { width: 20 },
            { width: 15 },
            { width: 15 }
        ];

        // Agregar totales
        const totalRow = worksheet.addRow([]);
        const totals = {
            monto_total: data.reduce((sum, item) => sum + parseFloat(item.monto_credito || 0), 0),
            capital_total: data.reduce((sum, item) => sum + parseFloat(item.capital_pagado || 0), 0),
            mora_total: data.reduce((sum, item) => sum + parseFloat(item.mora_total || 0), 0)
        };

        worksheet.addRow(['TOTALES', '', totals.monto_total, '', '', totals.capital_total, totals.mora_total]);

        // Estilo para totales
        const totalsRow = worksheet.lastRow;
        totalsRow.font = { bold: true };
        totalsRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
        };

        // Generar buffer
        return await workbook.xlsx.writeBuffer();
    }
}

module.exports = ExcelService;