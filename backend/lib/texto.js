// Normaliza un nombre para compararlo: sin acentos, minúsculas, espacios simples.
function normalizarNombre(nombre = '') {
    return String(nombre)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

// Limpia el nombre visible: recorta y colapsa espacios.
function limpiarNombre(nombre = '') {
    return String(nombre).replace(/\s+/g, ' ').trim();
}

module.exports = { normalizarNombre, limpiarNombre };
