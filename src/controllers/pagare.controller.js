const pool = require("../config/db");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { NumerosALetras } = require("numero-a-letras");

function calcularPrimerPago(fechaMinistracion, diaPago) {
  const dias = {
    lunes: 1, martes: 2, miercoles: 3,
    jueves: 4, viernes: 5, sabado: 6, domingo: 0
  };

  const fecha = new Date(fechaMinistracion);
  const objetivo = dias[diaPago.toLowerCase()];

  let fechaPago = new Date(fecha);

  // Buscar el siguiente día de pago
  while (fechaPago.getDay() !== objetivo) {
    fechaPago.setDate(fechaPago.getDate() + 1);
  }

  // Garantizar que haya al menos 1 día inhábil
  const diff = (fechaPago - fecha) / (1000 * 60 * 60 * 24);

  if (diff < 1) fechaPago.setDate(fechaPago.getDate() + 7);

  return fechaPago;
}
  
function generarCalendarioPagos(primerPago, capital, interes) {
  const calendario = [];
  let fecha = new Date(primerPago);

  for (let i = 1; i <= 16; i++) {
    calendario.push({
      numero: i,
      fecha: fecha.toLocaleDateString("es-MX", {
        day: "numeric", month: "long", year: "numeric"
      }),
      capital,
      interes,
      total: capital + interes
    });

    fecha.setDate(fecha.getDate() + 7);
  }

  return calendario;
}

const generarPagare = async (req, res) => {
  try {
    const { id_credito } = req.params;

    const resultado = await pool.query(`
      SELECT c.*, 
             cli.nombre_cliente, cli.app_cliente, cli.apm_cliente, cli.direccion_id,
             d.calle, d.numero, d.localidad, d.municipio,
             a.nom_aliado,
             s.dia_pago, tasa_interes
      FROM credito c
      JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      JOIN cliente cli ON cli.id_cliente = s.cliente_id
      JOIN direccion d ON d.id_direccion = cli.direccion_id
      JOIN aliado a ON a.id_aliado = c.aliado_id
      WHERE c.id_credito = $1
    `, [id_credito]);

    if (resultado.rows.length === 0)
      return res.status(404).json({ error: "Crédito no encontrado" });

    const data = resultado.rows[0];

    const monto = Number(data.total_capital);
    const interes = Number(data.total_interes) / 16;
    const tasaInteres = Number(data.tasa_fija)*100;
    const capitalPorPago = monto / 16;

    // CONVERSIÓN  A LETRAS
    const montoLetras = NumerosALetras(monto, {
      plural: 'pesos',
      singular: 'peso',
      centPlural: 'centavos',
      centSingular: 'centavo'
    });

    const primerPago = calcularPrimerPago(data.fecha_ministracion, data.dia_pago);
    const calendario = generarCalendarioPagos(primerPago, capitalPorPago, interes);

    const html = `
      <html>
      <body>
      <h1 style="text-align:center;">PAGARÉ 1/1</h1>

      <p>
        Por este pagaré prometo pagar a la orden de 
        <b>_________________________</b> en su domicilio en ________________ la cantidad de 
        <b>$${monto.toFixed(2)}</b> (${montoLetras.toUpperCase()}), mediante 16 pagos SEMANALES consecutivos de 
        acuerdo la cual causará intereses a razón de la tasa fija mensual del ${tasaInteres.toFixed(2)} % mismos que será pagaderos por
        semanas vencidad. Si el importe total o proporcional correspondiente a este pagaré no fuere pagado a su vencimiento, 
        causará intereses a razón de la tasa que se resulte de multiplicar por 1.8 veces la ultima Tasa de Interés
        Ordinaria. Dichos intereses se causaran desde la fecha en que incurra en el incumplimiento hasta la regularización de los pagos.
      </p>
      <br>
      <br>
      <p>
        El (los) suscriptores y sus(s) avalista(s), se someten expresamente para el caso de controversia judicial, a la competencia de
        los tribunales de la ciudad de DOLORES HIDALGO, GTO.
      </p>
      <br>
      <br>
      La cantidad antes señalada será pagada en 16 amortizaciones SEMANALES, y consecutivas, precisamente en las fechas
      establecidas en el calendario de amortizaciones.
      <br>
      <br>
      En la ciudad de DOLORES HIDALGO, GTO el ${new Date().toLocaleDateString("es-MX")}
      <br>
      <br>
      <h3>CALENDARIO DE AMORTIZACIÓN</h3>

      <table border="1" width="100%" cellspacing="0" cellpadding="5">
        <tr>
          <th>#</th>
          <th>Fecha</th>
          <th>Capital</th>
          <th>Intereses</th>
          <th>Total</th>
        </tr>

        ${calendario.map(p => `
          <tr>
            <td>${p.numero}</td>
            <td>${p.fecha}</td>
            <td>$${p.capital.toFixed(2)}</td>
            <td>$${p.interes.toFixed(2)}</td>
            <td>$${p.total.toFixed(2)}</td>
          </tr>
        `).join("")}
      </table>

      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const rutaPDF = path.join(__dirname, `../pagare_${id_credito}.pdf`);

    await page.pdf({ path: rutaPDF, format: "A4" });
    await browser.close();

    res.json({ message: "Pagaré generado", pdf: rutaPDF });

  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Error al generar pagaré" });
  }
};

module.exports = { generarPagare };
