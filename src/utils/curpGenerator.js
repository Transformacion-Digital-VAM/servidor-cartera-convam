
// Obtener la primera vocal interna del apellido paterno
const primeraVocal = (texto) => {
  const match = texto.slice(1).match(/[AEIOUaeiou]/);
  return match ? match[0] : 'X';
};

// Formatear fecha YYMMDD desde formato Date o string
const formatearFecha = (fecha) => {
  const f = new Date(fecha);
  const yy = f.getFullYear().toString().slice(2);
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const dd = String(f.getDate()).padStart(2, "0");
  return yy + mm + dd;
};

// Obtener consonante interna (segunda letra en adelante)
const consonanteInterna = (texto) => {
  const match = texto.slice(1).match(/[^AEIOUaeiou]/);
  return match ? match[0] : 'X';
};

// Generar CURP
const generarCURP = (nombre, apellidoP, apellidoM, fecha, sexo, estado) => {
  let curp = 
    apellidoP[0] +
    primeraVocal(apellidoP) +
    (apellidoM ? apellidoM[0] : 'X') +
    nombre[0] +
    formatearFecha(fecha) +
    sexo.toUpperCase() +
    estado.toUpperCase() +
    consonanteInterna(apellidoP) +
    consonanteInterna(apellidoM || '') +
    consonanteInterna(nombre) +
    '00';

  return curp.toUpperCase();
};

module.exports = { generarCURP };
