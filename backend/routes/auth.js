const express = require('express');
const validate = require('../middleware/validate');
const { passwordCorrecta, firmarToken } = require('../middleware/auth');
const schemas = require('../lib/schemas');

module.exports = function authRouter({ loginLimiter }) {
    const router = express.Router();

    router.post('/verifyAdmin', loginLimiter, validate(schemas.verifyAdmin), (req, res) => {
        if (passwordCorrecta(req.datos.password)) {
            return res.json({ ok: true, token: firmarToken() });
        }
        res.status(401).json({ ok: false, message: 'Contraseña incorrecta.' });
    });

    return router;
};
