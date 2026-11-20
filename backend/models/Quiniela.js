const mongoose = require('mongoose');

const QuinielaSchema = new mongoose.Schema({
    partidos: [{
        local:     { type: String, required: true },
        visita:    { type: String, required: true },
        resultado: { type: String, enum: ['local', 'empate', 'visita'], required: true }
    }],
    nombre:            { type: String },
    // Nombre sin acentos, en minúsculas y sin espacios repetidos; sirve para
    // detectar duplicados y agrupar la tabla general.
    nombreNormalizado: { type: String, index: true },
    celular:           { type: String },
    estadoPago:        { type: String, enum: ['pendiente', 'pagado'], default: 'pendiente' },
    jornada:           { type: Number, index: true }
});

module.exports = mongoose.model('Quiniela', QuinielaSchema);
