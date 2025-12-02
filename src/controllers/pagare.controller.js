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
             s.dia_pago, tasa_interes,
             av.nombre_aval, av.app_aval, av.apm_aval
      FROM credito c
      JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      JOIN cliente cli ON cli.id_cliente = s.cliente_id
      JOIN direccion d ON d.id_direccion = cli.direccion_id
      JOIN aliado a ON a.id_aliado = c.aliado_id
	    JOIN aval av ON av.id_aval = av.id_aval
      WHERE c.id_credito = $1
    `, [id_credito]);
      console.log(resultado.rows);
    if (resultado.rows.length === 0)
      return res.status(404).json({ error: "Crédito no encontrado" });

    const data = resultado.rows[0];

    const monto = Number(data.total_capital);
    const interes = Number(data.total_interes) / 16;
    const tasaInteres = Number(data.tasa_fija)*100;
    const capitalPorPago = monto / 16;
    const totalCapital = capitalPorPago * 16;
    const totalInteres = interes * 16;
    const totalPagare = totalCapital + totalInteres;

    const cliente = `${data.nombre_cliente} ${data.app_cliente} ${data.apm_cliente}`;
    const domicilio = `${data.calle} ${data.numero}, ${data.localidad}, ${data.municipio}`;

    //Aval
    const domicilioAval = `${data.calle} ${data.numero}, ${data.localidad}, ${data.municipio}`;
    const aval = `${data.nombre_aval} ${data.app_aval} ${data.apm_aval}`;

    // CONVERSIÓN A LETRAS
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
      <style>
        body {
          font-family: "Calibri", Arial, sans-serif;
          text-align: justify;
          margin-top: 0.5cm;
          margin-bottom: 0.5cm;
          font-size: 13px;
          margin-left: 0.5cm;
          margin-right: 0.5cm;
          line-height: 1.4;
          padding: 0.5cm;
        }
      </style>
      <body>
      <h1 style="text-align:center;">PAGARÉ 1/1</h1>

      <p>
        Por este pagaré prometo (emos) y me (nos) obligo (amos) a pagar a la orden de 
        <b>_________________________</b> en su domicilio en ________________ la cantidad de 
        <b>$${monto.toFixed(2)} (${montoLetras.toUpperCase()}), mediante 16 pagos SEMANALES consecutivos </b> de 
        acuerdo la cual causará intereses a razón de la tasa fija mensual del <b> ${tasaInteres.toFixed(2)} % </b> mismos que será pagaderos por
        semanas vencidad. Si el importe total o proporcional correspondiente a este pagaré no fuere pagado a su vencimiento, 
        causará intereses a razón de la tasa que se resulte de multiplicar por 1.8 veces la ultima Tasa de Interés
        Ordinaria. Dichos intereses se causaran desde la fecha en que incurra en el incumplimiento hasta la regularización de los pagos.
      </p>
      <p>
        El (los) suscriptores y sus(s) avalista(s), se someten expresamente para el caso de controversia judicial, a la competencia de
        los tribunales de la ciudad de DOLORES HIDALGO, GTO.
      </p>
      La cantidad antes señalada será pagada en <b>16 amortizaciones SEMANALES</b>, y consecutivas, precisamente en las fechas
      establecidas en el calendario de amortizaciones.
      En la ciudad de DOLORES HIDALGO, GTO el <b>${new Date().toLocaleDateString("es-MX")}</b>
      <h3 style="text-align:center;">CALENDARIO DE AMORTIZACIÓN</h3>

      <table border="0" width="100%" cellspacing="0" cellpadding="5" style="font-size: 11px;">
        <tr>
          <th style="border-bottom: 1px solid #000;">Vencimiento</th>
          <th style="border-bottom: 1px solid #000;">Fecha</th>
          <th style="border-bottom: 1px solid #000;">$ Capital</th>
          <th style="border-bottom: 1px solid #000;">$ Intereses</th>
          <th style="border-bottom: 1px solid #000;">$ Total</th>
        </tr>

        ${calendario.map(p => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${p.numero}</td>
            <td style="text-align: center; font-weight: bold;">${p.fecha}</td>
            <td style="text-align: center;">$${p.capital.toFixed(2)}</td>
            <td style="text-align: center;">$${p.interes.toFixed(2)}</td>
            <td style="text-align: center; font-weight: bold;">$ ${p.total.toFixed(2)}</td>
          </tr>
        `).join("")}
        <tfoot>
          <tr>
            <td colspan="2" style="text-align: center; font-weight: bold;">TOTAL: </td>
            <td style="text-align: center; font-weight: bold;">$ ${totalCapital.toFixed(2)}</td>
            <td style="text-align: center; font-weight: bold;">$ ${totalInteres.toFixed(2)}</td>
            <td style="text-align: center; font-weight: bold;">$ ${totalPagare.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table style="font-size: 11px;">
          <p>La falta de cualquiera de los abonos señalados, dará por vencido anticipadamente el plazo y será exigible en su
          totalidad el presente pagaré
          Como aval conozco y estoy de acuerdo con las responsabilidades credicticias que adquiero al momento de la firma
          de este pagare, me comprometo a responder ante la institución en caso de que el acreditado presente
          atrasos en los pagos de acuerdo a la fecha asignada.
          En la Ciudad de DOLORES HIDALGO, A ${new Date().toLocaleDateString("es-MX")}</p>
          <table style="font-size: 11px; width: 100%;">
            <tr>
              <th style="text-align: center">"EL ACREDITADO"</th>
              <th style="text-align: center">"EL AVAL"</th>
            </tr>
            <tr>
              <td>________________________________________</td>
              <td>________________________________________</td>
            </tr>
            <tr>
              <td><b> Nombre:</b> ${cliente}</td>
			        <td><b>Nombre:</b> ${aval}</td>
            </tr>
            <tr>
              <td><b>Domicilio:</b> ${domicilio}</td>
              <td><b>Domicilio:</b> ${domicilioAval}</td>
            </tr>
            <tr>
              <td><b>Población:</b> Dolores Hidalgo, Gto</td>
              <td><b>Población:</b> Dolores Hidalgo, Gto</td>
            </tr>
			
			
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
