const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFService {
    
    static async generateMinistrationsReport(data, filters) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks = [];
                
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                
                // Encabezado
                doc.fontSize(20).text('Reporte de Ministraciones', { align: 'center' });
                doc.moveDown();
                
                // Filtros aplicados
                if (Object.keys(filters).length > 0) {
                    doc.fontSize(10).text('Filtros aplicados:', { underline: true });
                    Object.entries(filters).forEach(([key, value]) => {
                        if (value && key !== 'format') {
                            doc.text(`${key}: ${value}`);
                        }
                    });
                    doc.moveDown();
                }
                
                // Tabla
                const tableTop = doc.y;
                const tableLeft = 50;
                const columnWidth = 80;
                
                // Encabezados de tabla
                const headers = ['ID', 'Fecha', 'Cliente', 'Capital', 'Estado'];
                headers.forEach((header, i) => {
                    doc.font('Helvetica-Bold')
                       .fontSize(10)
                       .text(header, tableLeft + (i * columnWidth), tableTop, { width: columnWidth });
                });
                
                doc.moveDown(0.5);
                
                // Línea separadora
                doc.moveTo(tableLeft, doc.y)
                   .lineTo(tableLeft + (columnWidth * headers.length), doc.y)
                   .stroke();
                
                doc.moveDown(0.5);
                
                // Datos
                data.forEach(item => {
                    const row = [
                        item.id_credito.toString(),
                        new Date(item.fecha_ministracion).toLocaleDateString(),
                        item.cliente_nombre.substring(0, 20),
                        `$${parseFloat(item.total_capital).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        item.estado_credito
                    ];
                    
                    row.forEach((cell, i) => {
                        doc.font('Helvetica')
                           .fontSize(9)
                           .text(cell, tableLeft + (i * columnWidth), doc.y, { width: columnWidth });
                    });
                    
                    doc.moveDown(0.5);
                });
                
                // Totales
                const totalCapital = data.reduce((sum, item) => sum + (parseFloat(item.total_capital) || 0), 0);
                const totalRows = data.length;
                
                doc.moveDown();
                doc.font('Helvetica-Bold')
                   .text(`Total de Ministraciones: ${totalRows}`, { align: 'right' });
                doc.text(`Capital Total: $${totalCapital.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, { align: 'right' });
                
                // Pie de página
                const pageHeight = doc.page.height;
                const footerY = pageHeight - 50;
                
                doc.fontSize(8)
                   .text(`Generado el: ${new Date().toLocaleDateString()}`, 50, footerY, { align: 'center' });
                
                doc.end();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    static async generateCapitalReport(data, totals, filters) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks = [];
                
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                
                // Título
                doc.fontSize(20).text('Reporte de Capital y Cartera', { align: 'center' });
                doc.moveDown();
                
                // Resumen
                doc.fontSize(12).text('Resumen de Cartera:', { underline: true });
                doc.moveDown(0.5);
                
                doc.fontSize(10).text(`Capital Total: $${totals.totalCapital.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                doc.text(`Cartera Vigente: $${totals.vigente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                doc.text(`Cartera Vencida: $${totals.vencida.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                doc.text(`Mora Acumulada: $${totals.mora.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
                
                doc.moveDown();
                
                // Detalle
                if (data.length > 0) {
                    doc.fontSize(12).text('Detalle de Créditos:', { underline: true });
                    doc.moveDown(0.5);
                    
                    data.slice(0, 50).forEach(item => { // Limitar a 50 registros en PDF
                        doc.fontSize(9)
                           .text(`Crédito ${item.id_credito} - ${item.cliente_nombre}`, { continued: true })
                           .text(` | Saldo: $${parseFloat(item.saldo_pendiente).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, { align: 'right' });
                        
                        doc.text(`   Estado: ${item.estado_credito} | Municipio: ${item.municipio} | Aliado: ${item.nom_aliado}`);
                        doc.moveDown(0.3);
                    });
                    
                    if (data.length > 50) {
                        doc.moveDown();
                        doc.fontSize(10)
                           .text(`... y ${data.length - 50} créditos más`, { align: 'center', italic: true });
                    }
                }
                
                // Pie de página
                const pageHeight = doc.page.height;
                const footerY = pageHeight - 50;
                
                doc.fontSize(8)
                   .text(`Total de créditos: ${data.length} | Generado: ${new Date().toLocaleDateString()}`, 
                         50, footerY, { align: 'center' });
                
                doc.end();
                
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFService;