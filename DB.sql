-- ============================================
-- CREACIÓN DE TABLAS DEL SISTEMA DE CARTERA
-- ============================================


CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(100) NOT NULL
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    rol INTEGER REFERENCES rol(id_rol),
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    firebase_uid VARCHAR(128) UNIQUE
)

CREATE TABLE solicitud (
    id_solicitud SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES cliente(id_cliente),
    usuario_id INTEGER REFERENCES usuario(id_usuario),
    fecha_creacion DATE NOT NULL,
    monto_solicitado NUMERIC(12,2),
    tasa_interes NUMERIC(6,2),
    tasa_moratoria NUMERIC(6,2),
    plazo_meses INTEGER,
    no_pagos INTEGER,
    tipo_vencimiento VARCHAR(50),
    seguro BOOLEAN,
    estado BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    fecha_aprobacion DATE
);

CREATE TABLE credito (
    id_credito SERIAL PRIMARY KEY,
    solicitud_id INTEGER REFERENCES solicitud(id_solicitud),
    responsable VARCHAR(100),
    fecha_ministracion DATE,
    fecha_primer_pago DATE,
    referencia_bancaria VARCHAR(50),
    tipo_credito VARCHAR(50),
    cuenta_bancaria VARCHAR(50),
    total_capital NUMERIC(12,2),
    total_interes NUMERIC(12,2),
    total_seguro NUMERIC(12,2),
    total_a_pagar NUMERIC(12,2),
    total_garantia NUMERIC(12,2),
    cat_porcentaje NUMERIC(6,2)
);

CREATE TABLE garantia (
    id_garantia SERIAL PRIMARY KEY,
    credito_id INTEGER REFERENCES credito(id_credito),
    monto_garantia NUMERIC(12,2)
);

CREATE TABLE pago (
    id_pago SERIAL PRIMARY KEY,
    credito_id INTEGER REFERENCES credito(id_credito),
    fecha_operacion DATE,
    capital NUMERIC(12,2),
    seguro NUMERIC(12,2),
    intereses NUMERIC(12,2),
    moratorios NUMERIC(12,2),
    total_pago NUMERIC(12,2),
    tipo_pago VARCHAR(50),
    registrado_por INTEGER REFERENCES usuario(id_usuario)
);

CREATE TABLE archivo (
    id_archivo SERIAL PRIMARY KEY,
    tipo VARCHAR(50),
    ruta_archivo TEXT,
    credito_id INTEGER REFERENCES credito(id_credito),
    fecha_generacion DATE
);


