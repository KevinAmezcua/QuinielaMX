const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, ADMIN_PASSWORD } = require('../config');

function requireAdmin(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado.' });
    }
    try {
        jwt.verify(auth.slice(7), JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: 'Sesión expirada. Vuelve a iniciar sesión.' });
    }
}

// Comparación en tiempo constante para no filtrar información por tiempos de respuesta.
function passwordCorrecta(password) {
    const a = crypto.createHash('sha256').update(String(password)).digest();
    const b = crypto.createHash('sha256').update(String(ADMIN_PASSWORD)).digest();
    return crypto.timingSafeEqual(a, b);
}

function firmarToken() {
    return jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { requireAdmin, passwordCorrecta, firmarToken };
