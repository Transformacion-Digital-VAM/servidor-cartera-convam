const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const pool = require("../config/db");

const generarPagare = async (req, res) => {
  const {
    cliente,
    domicilio,
    monto,
    interes,
    pagos,
    fecha,
    aval,
    folio,
    credito_id
  } = req.body;

  try {
    // 1. Cargar plantilla HTML
    let template = fs.readFileSync(
      path.join(__dirname, "../templates/pagare-template.html"),
      "utf8"
    );

    // 2.Variables
    template = template
      .replace(/{{cliente}}/g, cliente)
      .replace(/{{domicilio}}/g, domicilio)
      .replace(/{{monto}}/g, monto)
      .replace(/{{interes}}/g, interes)
      .replace(/{{pagos}}/g, pagos)
      .replace(/{{fecha}}/g, fecha)
      .replace(/{{aval}}/g, aval)
      .replace(/{{folio}}/g, folio);

    // 3. Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: "new"
    });

    const page = await browser.newPage();
    await page.setContent(template, { waitUntil: "networkidle0" });

    const fileName = `pagare_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "../uploads/", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // 4. Guardar registro en BD (tabla archivo)
    await pool.query(
      `INSERT INTO archivo (tipo, ruta_archivo, credito_id, fecha_generacion)
       VALUES ('pagare', $1, $2, NOW())`,
      [fileName, credito_id]
    );

    res.json({
      message: "Pagaré generado correctamente",
      archivo: fileName
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando pagaré", detalle: error });
  }
};

module.exports = { generarPagare };
