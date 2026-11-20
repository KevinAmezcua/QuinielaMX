const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ALLOWED_ORIGINS, TRUST_PROXY } = require('./config');
const { noEncontrado, manejarError } = require('./middleware/errors');

function limiter(windowMs, max, message) {
    return rateLimit({
        windowMs,
        max,
        message: { ok: false, message },
        standardHeaders: true,
        legacyHeaders: false,
    });
}

function createApp() {
    const app = express();

    // Necesario detrás del proxy de Render para que el rate limit vea la IP real.
    app.set('trust proxy', TRUST_PROXY);

    app.use(express.json({ limit: '50kb' }));
    app.use(cors({
        origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*',
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    const loginLimiter = limiter(15 * 60 * 1000, 5,  'Demasiados intentos fallidos. Espera 15 minutos.');
    const envioLimiter = limiter(15 * 60 * 1000, 20, 'Demasiados envíos desde esta conexión. Espera unos minutos.');

    app.get('/', (req, res) => res.json({ message: 'Bienvenido' }));

    app.use(require('./routes/auth')({ loginLimiter }));
    app.use(require('./routes/jornadas')());
    app.use(require('./routes/quinielas')({ envioLimiter }));

    app.use(noEncontrado);
    app.use(manejarError);

    return app;
}

module.exports = { createApp };
