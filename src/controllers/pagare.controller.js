const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const { NumerosALetras } = require("numero-a-letras");
const puppeteer = require("puppeteer");




function formatearFechaParaBD(fechaString) {
  const meses = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };

  const partes = fechaString.split(' de ');
  if (partes.length !== 3) return null;

  const dia = partes[0].padStart(2, '0');
  const mes = meses[partes[1].toLowerCase()];
  const año = partes[2];

  return `${año}-${mes}-${dia}`;
}

function generarCalendarioPagos(primerPago, capital, interes) {
  const calendario = [];
  let fecha = new Date(primerPago);

  for (let i = 1; i <= 16; i++) {
    const fechaFormateada = fecha.toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric"
    });

    const fechaISO = fecha.toISOString().split('T')[0];

    calendario.push({
      numero: i,
      fecha: fechaFormateada,
      fecha_iso: fechaISO,
      capital,
      interes,
      total: capital + interes
    });

    // Sumar 7 días para la siguiente semana
    fecha.setDate(fecha.getDate() + 7);
  }

  return calendario;
}

function calcularPrimerPago(fechaMinistracion, diaPago) {
  const dias = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
  };

  const fecha = new Date(fechaMinistracion);
  const objetivo = dias[diaPago.toLowerCase()];

  if (objetivo === undefined) {
    throw new Error(`Día de pago no válido: ${diaPago}`);
  }

  let fechaPago = new Date(fecha);

  // Buscar el siguiente día de pago después de la fecha de ministración
  fechaPago.setDate(fechaPago.getDate() + 1); // Empezar al día siguiente

  // Avanzar hasta encontrar el día correcto
  while (fechaPago.getDay() !== objetivo) {
    fechaPago.setDate(fechaPago.getDate() + 1);
  }

  // Verificar que haya al menos 1 día hábil entre ministración y primer pago
  const diffDias = Math.floor((fechaPago - fecha) / (1000 * 60 * 60 * 24));

  if (diffDias < 1) {
    // Si no hay al menos 1 día, sumar una semana
    fechaPago.setDate(fechaPago.getDate() + 7);
  }

  return fechaPago;
}

const generarPagare = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const { id_credito } = req.params;
    console.log("Generando pagaré para crédito:", id_credito);

    // ================================
    // 1. OBTENER DATOS DEL CRÉDITO
    // ================================
    const resultado = await client.query(`
      SELECT c.*, 
             cli.nombre_cliente, cli.app_cliente, cli.apm_cliente, cli.direccion_id,
             d.calle, d.numero, d.localidad, d.municipio,
             a.nom_aliado,
             s.dia_pago, s.no_pagos,
             av.nombre_aval, av.app_aval, av.apm_aval,
             dav.calle AS calle_aval,
             dav.numero AS numero_aval,
             dav.localidad AS localidad_aval,
             dav.municipio AS municipio_aval
      FROM credito c
      JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      JOIN cliente cli ON cli.id_cliente = s.cliente_id
      JOIN direccion d ON d.id_direccion = cli.direccion_id
      JOIN aliado a ON a.id_aliado = c.aliado_id
      JOIN aval av ON av.id_aval = c.aval_id
      JOIN direccion dav ON dav.id_direccion = av.direccion_id  
      WHERE c.id_credito = $1
    `, [id_credito]);

    if (resultado.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    const data = resultado.rows[0];

    // ================================
    // 2. CÁLCULOS DEL PAGARÉ
    // ================================
    const monto = Number(data.total_capital);
    const interes = Number(data.total_interes) / 16;
    const tasaInteres = Number(data.tasa_fija) * 100;

    const capitalPorPago = monto / 16;
    const totalCapital = monto;
    const totalInteres = interes * 16;
    const totalPagare = totalCapital + totalInteres;

    const cliente = `${data.nombre_cliente} ${data.app_cliente} ${data.apm_cliente}`;
    const domicilio = `${data.calle} ${data.numero}, ${data.localidad}, ${data.municipio}`;
    const aval = `${data.nombre_aval} ${data.app_aval} ${data.apm_aval}`;
    const domicilioAval = `${data.calle_aval} ${data.numero_aval}, ${data.localidad_aval}, ${data.municipio_aval}`;
    const montoLetras = NumerosALetras(monto, {
      plural: 'pesos',
      singular: 'peso',
      centPlural: 'centavos',
      centSingular: 'centavo'
    });

    // ================================
    // 3. GENERAR CALENDARIO
    // ================================
    // Priorizar fecha_primer_pago si ya existe en el crédito, si no calcularla
    const primerPago = data.fecha_primer_pago
      ? new Date(data.fecha_primer_pago)
      : calcularPrimerPago(data.fecha_ministracion, data.dia_pago);
    const calendario = generarCalendarioPagos(primerPago, capitalPorPago, interes);

    console.log("Primer pago calculado:", primerPago.toLocaleDateString("es-MX"));

    // Verificar si existe pagaré anterior
    const pagareResult = await client.query(
      `SELECT id_pagare, ruta_archivo FROM pagare WHERE credito_id = $1`,
      [id_credito]
    );

    if (pagareResult.rows.length > 0) {
      const existingPagare = pagareResult.rows[0];
      const pdfDir = path.join(__dirname, '../pdfs');
      const rutaPDF = path.join(pdfDir, existingPagare.ruta_archivo);

      // Comparar datos actuales con los del pagaré existente para ver si regeneramos
      const fechaPP_DB = existingPagare.fecha_primer_pago ? new Date(existingPagare.fecha_primer_pago).toISOString().split('T')[0] : null;
      const fechaPP_Nueva = primerPago.toISOString().split('T')[0];
      const montoDB = Number(existingPagare.total_capital);

      const sonIguales = (fechaPP_DB === fechaPP_Nueva) && (montoDB === totalCapital);

      if (fs.existsSync(rutaPDF) && sonIguales) {
        console.log("El pagaré ya existe y los datos coinciden, devolviendo archivo existente:", rutaPDF);
        await client.query("COMMIT");

        const pdfBuffer = fs.readFileSync(rutaPDF);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${existingPagare.ruta_archivo}"`);
        return res.send(pdfBuffer);
      } else {
        console.log("Los datos cambiaron o el archivo no existe, procediendo a recrear...");

        // Verificar si hay pagos registrados que impidan el borrado
        const pagosExistentes = await client.query(
          `SELECT id_pago FROM pago WHERE pagare_id = $1 LIMIT 1`,
          [existingPagare.id_pagare]
        );

        if (pagosExistentes.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "No se puede regenerar el pagaré porque ya existen pagos registrados para este crédito. Debe eliminar los pagos primero."
          });
        }

        // 1) Borrar calendario anterior
        await client.query(
          `DELETE FROM calendario_pago WHERE pagare_id = $1`,
          [existingPagare.id_pagare]
        );

        // 2) Borrar pagaré anterior
        await client.query(
          `DELETE FROM pagare WHERE id_pagare = $1`,
          [existingPagare.id_pagare]
        );

        // 3) Borrar archivo PDF si existe
        if (fs.existsSync(rutaPDF)) {
          fs.unlinkSync(rutaPDF);
        }
      }
    }

    // ================================
    // 4. INSERTAR PAGARÉ EN BD
    // ================================
    const pagareInsert = await client.query(
      `INSERT INTO pagare (
         credito_id, ruta_archivo, total_capital, total_interes, total_a_pagar,
         numero_pagos, dia_pago, fecha_primer_pago
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_pagare`,
      [
        id_credito,
        `pagare_${id_credito}.pdf`,
        totalCapital,
        totalInteres,
        totalPagare,
        16,
        data.dia_pago,
        primerPago.toISOString().split('T')[0] // Formato YYYY-MM-DD
      ]
    );

    const pagareId = pagareInsert.rows[0].id_pagare;
    console.log("Nuevo pagaré creado ID:", pagareId);

    // ================================
    // 5. INSERTAR CALENDARIO EN BD
    // ================================
    for (const p of calendario) {
      const totalSemana = p.capital + p.interes;

      await client.query(
        `INSERT INTO calendario_pago (
          pagare_id, numero_pago, fecha_vencimiento, 
          capital, interes, total_semana, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          pagareId,
          p.numero,
          p.fecha_iso,
          p.capital,
          p.interes,
          totalSemana,
          p.total
        ]
      );
    }

    console.log("Calendario insertado en BD");

    // ================================
    // 6. GENERAR PDF
    // ================================
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
        <b>CONVAM</b> en su domicilio en Rivera del Río #65 Int A - 3 Plaza Patria Zona Centro C.P. 37800, Dolores Hidalgo, Gto. la cantidad de 
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
          <th style="border-bottom: 1px solid #000;">$ IVA</th>
          <th style="border-bottom: 1px solid #000;">$ Total</th>
        </tr>

        ${calendario.map(p => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${p.numero}</td>
            <td style="text-align: center; font-weight: bold;">${p.fecha}</td>
            <td style="text-align: center;">$${p.capital.toFixed(2)}</td>
            <td style="text-align: center;">$${p.interes.toFixed(2)}</td>
            <td style="text-align: center;"></td>
            <td style="text-align: center; font-weight: bold;" colspan="2">$ ${p.total.toFixed(2)}</td>
          </tr>
        `).join("")}
        <tfoot>
          <tr>
            <td colspan="2" style="text-align: center; font-weight: bold;">TOTAL: </td>
            <td style="text-align: center; font-weight: bold;">$ ${totalCapital.toFixed(2)}</td>
            <td style="text-align: center; font-weight: bold;">$ ${totalInteres.toFixed(2)}</td>
            <td></td>
            <td style="text-align: center; font-weight: bold; colspan="2">$ ${totalPagare.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table style="font-size: 11px;">
          <p>La falta de cualquiera de los abonos señalados, dará por vencido anticipadamente el plazo y será exigible en su
          totalidad el presente pagaré
          Como aval conozco y estoy de acuerdo con las responsabilidades credicticias que adquiero al momento de la firma
          de este pagare, me comprometo a responder ante la institución en caso de que el acreditado presente
          atrasos en los pagos de acuerdo a la fecha asignada.
          En la Ciudad de DOLORES HIDALGO, GTO el ${new Date().toLocaleDateString("es-MX")}</p>
          <table style="font-size: 11px; width: 100%; align-content: center">
            <tr>
              <th style="text-align: center">"EL ACREDITADO"</th>
              <th style="text-align: center">"EL AVAL"</th>
              <br>
            </tr>
            <tr>
              <td>___________________________________________________</td>
              <td>___________________________________________________</td>
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

    // Iniciar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Crear directorio si no existe
    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const rutaPDF = path.join(pdfDir, `pagare_${id_credito}.pdf`);

    await page.pdf({
      path: rutaPDF,
      format: "A4",
      printBackground: true,
      margin: {
        top: '0.5cm',
        bottom: '0.5cm',
        left: '0.5cm',
        right: '0.5cm'
      }
    });

    await browser.close();
    console.log("PDF generado en:", rutaPDF);

    await client.query("COMMIT");

    // ================================
    // 7. ENVIAR ARCHIVO PDF
    // ================================
    if (!fs.existsSync(rutaPDF)) {
      throw new Error(`El archivo PDF no se generó en: ${rutaPDF}`);
    }

    const pdfBuffer = fs.readFileSync(rutaPDF);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="pagare_${id_credito}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al generar pagaré:", error);
    res.status(500).json({
      error: "Error al generar pagaré",
      detalle: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    client.release();
  }
};

const generarHojaControl = async (req, res) => {
  const client = await pool.connect();
  const { id_credito } = req.params;

  try {
    // --- 1. OBTENER DATOS DEL CRÉDITO ---
    const queryCredito = `
      SELECT c.*,
             s.no_pagos, s.dia_pago, s.tipo_vencimiento,
             cli.nombre_cliente, cli.app_cliente, cli.apm_cliente, cli.ciclo_actual,
             al.nom_aliado
      FROM credito c
      JOIN solicitud s ON s.id_solicitud = c.solicitud_id
      JOIN cliente cli ON cli.id_cliente = s.cliente_id
      JOIN aliado al ON al.id_aliado = c.aliado_id
      WHERE c.id_credito = $1
    `;

    const creditoResult = await client.query(queryCredito, [id_credito]);

    if (creditoResult.rowCount === 0) {
      return res.status(404).json({ message: "Crédito no encontrado" });
    }

    const data = creditoResult.rows[0];

    // --- 2. GENERAR CALENDARIO ---
    const monto = Number(data.total_capital);
    const interes = Number(data.total_interes) / data.no_pagos;
    const capitalPorPago = monto / data.no_pagos;

    const primerPago = data.fecha_primer_pago
      ? new Date(data.fecha_primer_pago)
      : calcularPrimerPago(data.fecha_ministracion, data.dia_pago);
    const calendario = generarCalendarioPagos(primerPago, capitalPorPago, interes);

    // --- 3. ARMAR TABLA DE LA HOJA DE CONTROL ---
    let saldoInicial = Number(data.total_a_pagar);
    const pagoSemanal = Number(data.pago_semanal);

    const tabla = calendario.map(p => {
      const saldoFinal = saldoInicial - pagoSemanal;
      const fila = {
        semana: p.numero,
        fecha: p.fecha,
        saldo_inicial: saldoInicial.toFixed(2),
        pago: pagoSemanal.toFixed(2),
        saldo_final: (saldoFinal < 0 ? 0 : saldoFinal).toFixed(2),
        observaciones: ""
      };
      saldoInicial = saldoFinal;
      return fila;
    });
    const pagosFormateados = Number(data.total_a_pagar).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const totalGarantiaFormateado = Number(data.total_garantia).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const pagoSemanalFormateado = Number(data.pago_semanal).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });


    // --- 4. TEMPLATE HTML ---
    const html = `
      <html>
      <head>
        <style>
          body { 
            font-family: calibri; 
            padding: 80px; 
            font-size: 12px;
          }
          h2 { text-align: center; margin-bottom: 0; }
          .header-table td { padding: 3px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td {
            padding: 3px; /* Espacio interior */
          }
        </style>
      </head>
      <body>
      <div style="text-align: right; margin-bottom: 5px;">
        <img 
          src="https://drive.google.com/thumbnail?id=16Cf-Mz26xqZcr8y1rSJceD1ao6kVkaZp" 
          alt="Logo" 
          style="width: 150px; height: 60px;">
      </div>

        <h2 style="text-align:center; margin-top:20px">CONTROL INDIVIDUAL DE PAGOS Y GARANTÍAS</h2>

        <p style="text-align:right"><strong>NOMBRE DE CLIENTE:</strong> ${data.nombre_cliente} ${data.app_cliente} ${data.apm_cliente}</p>
        <p style="text-align:right"><strong>RESPONSABLE:</strong> ${data.nom_aliado}</p>


        <p style="text-align:left"><strong>CICLO:</strong> ${data.ciclo_actual}</p>
        <table style="width: 50%; text-align: left; border: 0; border-collapse: collapse;">
          <tr>
            <td>NO. DE PAGOS: <b>${data.no_pagos}</b></td>
          </tr>
          <tr>
            <td>PERIODO: <b>${data.tipo_vencimiento}</b></td>
          </tr>
          <tr>
            <td>DÍA DE PAGO: <b>${data.dia_pago}</b></td>
          </tr>
          <tr>
            <td>TASA DE INTERÉS: <b> ${(data.tasa_fija * 100).toFixed(2)}%</b></td>
          </tr>
          <tr>
            <td>SALDO INICIAL: <b> $${pagosFormateados}</b></td>
          </tr>
          <tr>
            <td>GARANTÍAS DEL CICLO: <b>$${totalGarantiaFormateado}</b></td>
          </tr>
          <tr>
            <td>PAGO PACTADO: <b>$${pagoSemanalFormateado}</b></td>
          </tr>
        </table>

        <table border="2">
          <thead>
            <tr>
              <th>SEM</th>
              <th>FECHA</th>
              <th>SALDO INICIAL</th>
              <th>PAGO</th>
              <th>SALDO FINAL</th>
              <th>OBSERVACIONES</th>
            </tr>
          </thead>
          <tbody>
            ${tabla.map(r => `
              <tr>
                <td style="text-align: center;">${r.semana}</td>
                <td style="text-align: left;">${r.fecha}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <p style="margin-top: 65px; text-align: center; margin-bottom: 35px;"><strong>FIRMA DE ${data.nom_aliado}</strong></p>
        <p style="text-align: center;">______________________________________________</p>
      </body>
      </html>
    `;

    // --- 5. GENERAR PDF CON PUPPETEER ---
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Crear directorio si no existe
    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const rutaPDF = path.join(pdfDir, `hoja-control_${id_credito}.pdf`);

    await page.pdf({
      path: rutaPDF,
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // --- 6. ENVIAR ARCHIVO PDF ---
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="hoja-control_${id_credito}.pdf"`);
    const pdfBuffer = fs.readFileSync(rutaPDF);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generando hoja de control:", error);
    res.status(500).json({
      message: "Error interno",
      error: error.message
    });
  } finally {
    client.release();
  }
};

// CRUD CALENDARIO PAGO 

// Obtener calendario por pagare
const obtenerCalendarioPorPagare = async (req, res) => {
  try {
    const { pagare_id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM calendario_pago
       WHERE pagare_id = $1
       ORDER BY numero_pago`,
      [pagare_id]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener calendario por cliente
const obtenerCalendarioPorCliente = async (req, res) => {
  try {
    const { id_cliente } = req.params;

    const result = await pool.query(
      `SELECT 
          cp.id_calendario,
          cp.numero_pago,
          cp.fecha_vencimiento,
          cp.capital,
          cp.interes,
          cp.total_semana,
          cp.total,
          cp.pagado,
          cp.estatus,
          cp.fecha_pago,
          cp.mora_acumulada,
          p.id_pagare,
          c.id_credito
       FROM calendario_pago cp
       JOIN pagare p ON p.id_pagare = cp.pagare_id
       JOIN credito c ON c.id_credito = p.credito_id
       JOIN solicitud s ON s.id_solicitud = c.solicitud_id
       JOIN cliente cli ON cli.id_cliente = s.cliente_id
       WHERE cli.id_cliente = $1
       ORDER BY cp.fecha_vencimiento`,
      [id_cliente]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener calendario por crédito
const obtenerCalendarioPorCredito = async (req, res) => {
  try {
    const { id_credito } = req.params;

    const result = await pool.query(
      `SELECT cp.*
       FROM calendario_pago cp
       JOIN pagare p ON p.id_pagare = cp.pagare_id
       WHERE p.credito_id = $1
       ORDER BY cp.numero_pago`,
      [id_credito]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { generarPagare, generarHojaControl, obtenerCalendarioPorPagare, obtenerCalendarioPorCliente, obtenerCalendarioPorCredito };