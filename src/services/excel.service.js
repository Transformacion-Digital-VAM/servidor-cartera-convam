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
}

module.exports = ExcelService;