const mongoose = require('mongoose');

const PartidoSchema = new mongoose.Schema({
    local:     { type: String, required: true },
    localImg:  { type: String, required: true },
    visita:    { type: String, required: true },
    visitaImg: { type: String, required: true },
    fecha:     { type: String, required: true }, // YYYY-MM-DD
    hora:      { type: String, required: true }, // HH:MM
    resultado: { type: String, enum: ['local', 'empate', 'visita', ''], default: '' }
});

const JornadaSchema = new mongoose.Schema({
    numero:         { type: Number,  required: true, unique: true },
    archivada:      { type: Boolean, default: false },
    enviosAbiertos: { type: Boolean, default: true },
    partidos:       [PartidoSchema]
});

// Jornada activa = la de número más alto que no está archivada.
JornadaSchema.statics.activa = function () {
    return this.findOne({ archivada: { $ne: true } }).sort({ numero: -1 });
};

module.exports = mongoose.model('Jornada', JornadaSchema);
