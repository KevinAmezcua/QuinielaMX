const express = require('express');
const Jornada  = require('../models/Jornada');
const Quiniela = require('../models/Quiniela');
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const { aceptaEnvios } = require('../lib/fechas');
const { normalizarNombre } = require('../lib/texto');
const { calcularRanking, calcularRankingGeneral } = require('../lib/ranking');
const schemas = require('../lib/schemas');

// Campos privados que nunca salen en endpoints públicos.
const CAMPOS_PUBLICOS = '-celular -nombreNormalizado';

module.exports = function quinielasRouter({ envioLimiter }) {
    const router = express.Router();

    // Público: quinielas sin datos de contacto.
    router.get('/getQuiniela', validate(schemas.queryJornada, 'query'), async (req, res) => {
        const { jornada } = req.datos;
        const filtro = jornada ? { jornada } : {};
        const quinielas = await Quiniela.find(filtro).select(CAMPOS_PUBLICOS);
        res.json({ message: 'Resultados obtenidos con éxito.', quinielas });
    });

    // Admin: incluye celular y estado de pago.
    router.get('/admin/quinielas', requireAdmin, validate(schemas.queryJornadaRequerida, 'query'), async (req, res) => {
        const quinielas = await Quiniela.find({ jornada: req.datos.jornada }).select('-nombreNormalizado');
        res.json({ quinielas });
    });

    router.post('/newQuiniela', envioLimiter, validate(schemas.nuevaQuiniela), async (req, res) => {
        const { nombre, partidos } = req.datos;

        // La jornada siempre es la activa; se ignora cualquier número enviado por el cliente.
        const jornada = await Jornada.activa();
        if (!jornada) {
            return res.status(404).json({ message: 'No hay una jornada activa.' });
        }
        if (!aceptaEnvios(jornada)) {
            return res.status(403).json({ message: 'Los envíos están cerrados para esta jornada.' });
        }
        if (partidos.length !== jornada.partidos.length) {
            return res.status(400).json({
                message: `Debes enviar exactamente ${jornada.partidos.length} partidos.`
            });
        }
        const coinciden = partidos.every((p, i) =>
            p.local === jornada.partidos[i].local && p.visita === jornada.partidos[i].visita);
        if (!coinciden) {
            return res.status(400).json({
                message: 'Los partidos no coinciden con la jornada actual. Recarga la página e inténtalo de nuevo.'
            });
        }

        const nombreNormalizado = normalizarNombre(nombre);
        const duplicada = await Quiniela.exists({ jornada: jornada.numero, nombreNormalizado });
        if (duplicada) {
            return res.status(409).json({
                message: `Ya existe una quiniela con el nombre "${nombre}" en esta jornada. Usa otro nombre (por ejemplo, agrega tu apellido).`
            });
        }

        await new Quiniela({
            nombre,
            nombreNormalizado,
            partidos,
            jornada: jornada.numero
        }).save();

        res.json({ message: 'Quiniela creada con éxito.', jornada: jornada.numero });
    });

    // Clasificación de una jornada (por defecto, la activa) con empates.
    router.get('/ranking', validate(schemas.queryJornada, 'query'), async (req, res) => {
        const { jornada: numero } = req.datos;
        const jornada = numero ? await Jornada.findOne({ numero }) : await Jornada.activa();
        if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada.' });

        const quinielas = await Quiniela.find({ jornada: jornada.numero }).select(CAMPOS_PUBLICOS).lean();
        res.json({
            jornada: {
                numero:   jornada.numero,
                archivada: jornada.archivada,
                partidos: jornada.partidos.map(p => ({
                    local: p.local, localImg: p.localImg,
                    visita: p.visita, visitaImg: p.visitaImg,
                    resultado: p.resultado
                }))
            },
            ranking: calcularRanking(jornada, quinielas)
        });
    });

    // Tabla general acumulada de todas las jornadas.
    router.get('/rankingGeneral', async (req, res) => {
        const [jornadas, quinielas] = await Promise.all([
            Jornada.find().lean(),
            Quiniela.find().select('-celular').lean()
        ]);
        res.json({ ranking: calcularRankingGeneral(jornadas, quinielas) });
    });

    router.patch('/updatePago/:id', requireAdmin, validate(schemas.updatePago), async (req, res) => {
        const quiniela = await Quiniela.findByIdAndUpdate(
            req.params.id,
            { estadoPago: req.datos.estadoPago },
            { new: true }
        );
        if (!quiniela) return res.status(404).json({ message: 'Quiniela no encontrada.' });
        res.json({ ok: true, estadoPago: quiniela.estadoPago });
    });

    router.delete('/deleteQuiniela/:quinielaId', requireAdmin, async (req, res) => {
        const deleted = await Quiniela.findByIdAndDelete(req.params.quinielaId);
        if (!deleted) return res.status(404).json({ message: 'Quiniela no encontrada.' });
        res.json({ message: 'Quiniela eliminada con éxito.' });
    });

    // Requiere jornada explícita para evitar borrar todo por accidente.
    router.delete('/deleteAllQuinielas', requireAdmin, async (req, res) => {
        const parsed = schemas.queryJornadaRequerida.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.status(400).json({ message: 'Se requiere el número de jornada.' });
        }
        const { deletedCount } = await Quiniela.deleteMany({ jornada: parsed.data.jornada });
        res.json({ message: `${deletedCount} quiniela(s) eliminada(s).`, deletedCount });
    });

    return router;
};
