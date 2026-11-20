function noEncontrado(req, res) {
    res.status(404).json({ message: 'Ruta no encontrada.' });
}

// Manejador central: registra el detalle en el servidor y responde sin exponerlo.
// eslint-disable-next-line no-unused-vars
function manejarError(err, req, res, next) {
    if (err?.name === 'CastError') {
        return res.status(400).json({ message: 'Identificador inválido.' });
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'JSON inválido.' });
    }
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    res.status(500).json({ message: 'Error interno del servidor.' });
}

module.exports = { noEncontrado, manejarError };
