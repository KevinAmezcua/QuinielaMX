const express = require('express');
const Jornada  = require('../models/Jornada');
const Quiniela = require('../models/Quiniela');
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const { cierreEnvios, aceptaEnvios } = require('../lib/fechas');
const schemas = require('../lib/schemas');

// Agrega al JSON de la jornada el estado efectivo de los envíos.
function conEstadoEnvios(jornada) {
    const obj = jornada.toObject ? jornada.toObject() : { ...jornada };
    const cierre = cierreEnvios(obj);
    obj.cierreEnvios = cierre ? cierre.toISOString() : null;
    obj.aceptaEnvios = aceptaEnvios(obj);
    return obj;
}

module.exports = function jornadasRouter() {
    const router = express.Router();

    router.get('/getAllJornadas', async (req, res) => {
        const jornadas = await Jornada.find().sort({ numero: -1 });
        res.json({ jornadas });
    });

    router.get('/getJornada', async (req, res) => {
        const jornada = await Jornada.activa();
        if (!jornada) return res.status(404).json({ message: 'No hay jornada configurada.' });
        res.json({ jornada: conEstadoEnvios(jornada) });
    });

    router.put('/setJornada', requireAdmin, validate(schemas.setJornada), async (req, res) => {
        const { numero, partidos } = req.datos;

        // Conserva el resultado ya capturado si el partido en esa posición no cambió.
        const existente = await Jornada.findOne({ numero });
        const anteriores = existente?.partidos || [];
        const nuevos = partidos.map((p, i) => {
            const prev = anteriores[i];
            const mismo = prev && prev.localImg === p.localImg && prev.visitaImg === p.visitaImg;
            return { ...p, resultado: mismo ? prev.resultado : '' };
        });

        const jornada = await Jornada.findOneAndUpdate(
            { numero },
            { numero, partidos: nuevos },
            { upsert: true, new: true, runValidators: true }
        );
        res.json({ message: 'Jornada guardada con éxito.', jornada: conEstadoEnvios(jornada) });
    });

    router.put('/setResultados', requireAdmin, validate(schemas.setResultados), async (req, res) => {
        const { numero, resultados } = req.datos;

        const jornada = await Jornada.findOne({ numero });
        if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada.' });
        if (resultados.length !== jornada.partidos.length) {
            return res.status(400).json({ message: `Se esperan ${jornada.partidos.length} resultados.` });
        }

        resultados.forEach((r, i) => { jornada.partidos[i].resultado = r; });
        await jornada.save();
        res.json({ message: 'Resultados actualizados con éxito.' });
    });

    router.put('/archivarJornada', requireAdmin, validate(schemas.conNumero), async (req, res) => {
        const { numero } = req.datos;
        const jornada = await Jornada.findOneAndUpdate({ numero }, { archivada: true }, { new: true });
        if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada.' });
        res.json({ message: `Jornada ${numero} archivada. Ya aparece en el historial.` });
    });

    router.put('/toggleEnvios', requireAdmin, validate(schemas.conNumero), async (req, res) => {
        const jornada = await Jornada.findOne({ numero: req.datos.numero });
        if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada.' });

        jornada.enviosAbiertos = !jornada.enviosAbiertos;
        await jornada.save();

        const estado = conEstadoEnvios(jornada);
        res.json({
            message: `Envíos ${jornada.enviosAbiertos ? 'activados' : 'desactivados'}.`,
            enviosAbiertos: estado.enviosAbiertos,
            aceptaEnvios:   estado.aceptaEnvios,
            cierreEnvios:   estado.cierreEnvios
        });
    });

    // Borra una jornada concreta junto con sus quinielas.
    router.delete('/deleteJornada', requireAdmin, validate(schemas.conNumero), async (req, res) => {
        const { numero } = req.datos;
        const deleted = await Jornada.findOneAndDelete({ numero });
        if (!deleted) return res.status(404).json({ message: 'Jornada no encontrada.' });

        const { deletedCount } = await Quiniela.deleteMany({ jornada: numero });
        res.json({ message: `Jornada ${numero} eliminada junto con ${deletedCount} quiniela(s).` });
    });

    router.delete('/deleteHistorial', requireAdmin, async (req, res) => {
        const archivadas = await Jornada.find({ archivada: true }, 'numero');
        const numeros    = archivadas.map(j => j.numero);

        const quinielasResult = await Quiniela.deleteMany({ jornada: { $in: numeros } });
        const jornadasResult  = await Jornada.deleteMany({ archivada: true });

        res.json({
            message: `Historial eliminado: ${jornadasResult.deletedCount} jornada(s) y ${quinielasResult.deletedCount} quiniela(s).`
        });
    });

    return router;
};
