const { TZ_OFFSET } = require('../config');

// Convierte fecha (YYYY-MM-DD) + hora (HH:MM) capturadas en hora local a Date.
function aFecha(fecha, hora, offset = TZ_OFFSET) {
    const d = new Date(`${fecha}T${hora}:00${offset}`);
    return isNaN(d) ? null : d;
}

// Momento en que se cierran los envíos: el inicio del primer partido.
function cierreEnvios(jornada, offset = TZ_OFFSET) {
    const fechas = (jornada?.partidos || [])
        .map(p => aFecha(p.fecha, p.hora, offset))
        .filter(Boolean);
    if (fechas.length === 0) return null;
    return new Date(Math.min(...fechas.map(f => f.getTime())));
}

// La jornada acepta envíos si el admin no los cerró y no ha empezado el primer partido.
function aceptaEnvios(jornada, ahora = new Date(), offset = TZ_OFFSET) {
    if (!jornada || jornada.enviosAbiertos === false) return false;
    const cierre = cierreEnvios(jornada, offset);
    return !cierre || ahora < cierre;
}

module.exports = { aFecha, cierreEnvios, aceptaEnvios };
