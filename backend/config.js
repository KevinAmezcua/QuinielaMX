// Carga y valida la configuración desde variables de entorno.
// dotenv se carga aquí, antes de leer cualquier variable.
require('dotenv').config();

const REQUERIDAS = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_PASSWORD'];

function faltantes() {
    return REQUERIDAS.filter(nombre => !process.env[nombre]);
}

const origins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

module.exports = {
    faltantes,
    PORT:           process.env.PORT || 3000,
    MONGO_URI:      process.env.MONGO_URI,
    JWT_SECRET:     process.env.JWT_SECRET,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    // Lista de orígenes permitidos para CORS. Vacía = cualquier origen.
    ALLOWED_ORIGINS: origins,
    // Zona horaria en la que el admin captura fecha/hora de los partidos.
    // México (centro) es UTC-6 todo el año desde 2022.
    TZ_OFFSET:      process.env.TZ_OFFSET || '-06:00',
    // Número de proxies delante del servidor (Render usa 1).
    TRUST_PROXY:    Number(process.env.TRUST_PROXY ?? 1),
};
