const mongoose = require('mongoose');
const config = require('./config');

const faltantes = config.faltantes();
if (faltantes.length) {
    console.error(`Error: faltan variables de entorno: ${faltantes.join(', ')}. Revisa .env.example.`);
    process.exit(1);
}

if (!config.ALLOWED_ORIGINS.length) {
    console.warn('Aviso: ALLOWED_ORIGINS no está definida; se aceptan peticiones de cualquier origen.');
}

const { createApp } = require('./app');

async function main() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('MongoDB Conectado');
    } catch (error) {
        console.error('No se pudo conectar a MongoDB:', error.message);
        process.exit(1);
    }

    createApp().listen(config.PORT, () => {
        console.log(`Servidor escuchando en puerto ${config.PORT}`);
    });
}

main();
