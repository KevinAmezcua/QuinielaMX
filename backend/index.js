const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();

if (!process.env.MONGO_URI) {
    console.error("Error: La variable MONGO_URI no está definida.");
    process.exit(1);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Conectado"))
.catch(error => console.log(error.message));

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Schemas ────────────────────────────────────────────────────────────────

const JornadaSchema = new mongoose.Schema({
    numero:         { type: Number,  required: true, unique: true },
    archivada:      { type: Boolean, default: false },
    enviosAbiertos: { type: Boolean, default: true },
    partidos: [{
        local:     { type: String, required: true },
        localImg:  { type: String, required: true },
        visita:    { type: String, required: true },
        visitaImg: { type: String, required: true },
        fecha:     { type: String, required: true },
        hora:      { type: String, required: true },
        resultado: { type: String, enum: ['local', 'empate', 'visita', ''], default: '' }
    }]
});
const Jornada = mongoose.model('Jornada', JornadaSchema);

const QuinielaSchema = new mongoose.Schema({
    partidos: [{
        local:     { type: String, required: true },
        visita:    { type: String, required: true },
        resultado: { type: String, enum: ['local', 'empate', 'visita'], required: true }
    }],
    nombre:  { type: String },
    jornada: { type: Number }
});
const Quiniela = mongoose.model('Quiniela', QuinielaSchema);

// ─── Jornada endpoints ───────────────────────────────────────────────────────

app.post('/verifyAdmin', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false, message: "Contraseña incorrecta." });
});

app.get('/', (req, res) => {
    res.json({ message: "Bienvenido" });
});

app.get('/getAllJornadas', async (req, res) => {
    try {
        const jornadas = await Jornada.find().sort({ numero: -1 });
        return res.status(200).json({ jornadas });
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener jornadas.", error });
    }
});

app.get('/getJornada', async (req, res) => {
    try {
        const jornada = await Jornada.findOne({ archivada: { $ne: true } }).sort({ numero: -1 });
        if (!jornada) {
            return res.status(404).json({ message: "No hay jornada configurada." });
        }
        return res.status(200).json({ jornada });
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener jornada.", error });
    }
});

app.put('/setJornada', async (req, res) => {
    try {
        const { password, numero, partidos } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }
        if (!numero || !Array.isArray(partidos) || partidos.length === 0) {
            return res.status(400).json({ message: "Datos inválidos. Se requiere numero y partidos." });
        }

        const jornadaData = {
            numero,
            partidos: partidos.map(p => ({ ...p, resultado: p.resultado || '' }))
        };

        const jornada = await Jornada.findOneAndUpdate(
            { numero },
            jornadaData,
            { upsert: true, new: true }
        );

        return res.status(200).json({ message: "Jornada guardada con éxito.", jornada });
    } catch (error) {
        return res.status(500).json({ message: "Error al guardar jornada.", error });
    }
});

app.put('/setResultados', async (req, res) => {
    try {
        const { password, numero, resultados } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }

        const jornada = await Jornada.findOne({ numero });
        if (!jornada) {
            return res.status(404).json({ message: "Jornada no encontrada." });
        }
        if (!Array.isArray(resultados) || resultados.length !== jornada.partidos.length) {
            return res.status(400).json({ message: `Se esperan ${jornada.partidos.length} resultados.` });
        }

        resultados.forEach((r, i) => {
            jornada.partidos[i].resultado = r;
        });
        await jornada.save();

        return res.status(200).json({ message: "Resultados actualizados con éxito." });
    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar resultados.", error });
    }
});

// ─── Quiniela endpoints ──────────────────────────────────────────────────────

app.get('/getQuiniela', async (req, res) => {
    try {
        const { jornada } = req.query;
        const filter = jornada ? { jornada: parseInt(jornada) } : {};
        const quinielas = await Quiniela.find(filter);
        return res.status(200).json({
            message: "Resultados obtenidos con éxito.",
            quinielas
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al consultar Resultados.", error });
    }
});

app.post('/newQuiniela', async (req, res) => {
    try {
        const { nombre, partidos, jornada } = req.body;

        const jornadaActual = await Jornada.findOne().sort({ numero: -1 });
        const expectedCount = jornadaActual ? jornadaActual.partidos.length : 9;

        if (jornadaActual && jornadaActual.enviosAbiertos === false) {
            return res.status(403).json({ message: "Los envíos están cerrados para esta jornada." });
        }

        if (!nombre || !Array.isArray(partidos) || partidos.length !== expectedCount) {
            return res.status(400).json({
                message: `Datos inválidos. Debes enviar nombre y exactamente ${expectedCount} partidos.`
            });
        }

        for (const partido of partidos) {
            if (!partido.local || !partido.visita || !['local', 'empate', 'visita'].includes(partido.resultado)) {
                return res.status(400).json({
                    message: "Cada partido debe tener local, visita y resultado válido (local, empate, visita)."
                });
            }
        }

        const newQuiniela = new Quiniela({
            nombre,
            partidos,
            jornada: jornada || (jornadaActual ? jornadaActual.numero : null)
        });

        await newQuiniela.save();
        return res.status(200).json({ message: "Quiniela creada con éxito." });
    } catch (error) {
        return res.status(500).json({ message: "Error al crear Quiniela.", error });
    }
});

app.delete('/deleteQuiniela/:quinielaId', async (req, res) => {
    try {
        const quinielaId = req.params.quinielaId;
        const deleted = await Quiniela.findByIdAndDelete(quinielaId);

        if (!deleted) {
            return res.status(404).json({ message: "Quiniela no encontrada." });
        }
        return res.status(200).json({ message: "Quiniela eliminada con éxito." });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar Quiniela.", error });
    }
});

app.put('/archivarJornada', async (req, res) => {
    try {
        const { password, numero } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }
        if (!numero) {
            return res.status(400).json({ message: "Se requiere el número de jornada." });
        }

        const jornada = await Jornada.findOneAndUpdate(
            { numero: parseInt(numero) },
            { archivada: true },
            { new: true }
        );

        if (!jornada) {
            return res.status(404).json({ message: "Jornada no encontrada." });
        }
        return res.status(200).json({ message: `Jornada ${numero} archivada. Ya aparece en el historial.` });
    } catch (error) {
        return res.status(500).json({ message: "Error al archivar jornada.", error });
    }
});

app.put('/toggleEnvios', async (req, res) => {
    try {
        const { password, numero } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }
        if (!numero) {
            return res.status(400).json({ message: "Se requiere el número de jornada." });
        }

        const jornada = await Jornada.findOne({ numero: parseInt(numero) });
        if (!jornada) {
            return res.status(404).json({ message: "Jornada no encontrada." });
        }

        jornada.enviosAbiertos = !jornada.enviosAbiertos;
        await jornada.save();

        return res.status(200).json({
            message: `Envíos ${jornada.enviosAbiertos ? 'activados' : 'desactivados'}.`,
            enviosAbiertos: jornada.enviosAbiertos
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al cambiar el estado de envíos.", error });
    }
});

app.delete('/deleteJornada', async (req, res) => {
    try {
        const { password, numero } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }

        const filter = numero ? { numero: parseInt(numero) } : {};
        const deleted = await Jornada.findOneAndDelete(filter);

        if (!deleted) {
            return res.status(404).json({ message: "Jornada no encontrada." });
        }
        return res.status(200).json({ message: "Jornada eliminada con éxito." });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar jornada.", error });
    }
});

app.delete('/deleteHistorial', async (req, res) => {
    try {
        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }

        const archivadas = await Jornada.find({ archivada: true }, 'numero');
        const numeros    = archivadas.map(j => j.numero);

        const quinielasResult = await Quiniela.deleteMany({ jornada: { $in: numeros } });
        const jornadasResult  = await Jornada.deleteMany({ archivada: true });

        return res.status(200).json({
            message: `Historial eliminado: ${jornadasResult.deletedCount} jornada(s) y ${quinielasResult.deletedCount} quiniela(s).`
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al limpiar el historial.", error });
    }
});

app.delete('/deleteAllQuinielas', async (req, res) => {
    try {
        const { password, jornada } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Contraseña incorrecta." });
        }

        const filter = jornada ? { jornada: parseInt(jornada) } : {};
        const result = await Quiniela.deleteMany(filter);

        return res.status(200).json({ message: `${result.deletedCount} quiniela(s) eliminada(s).`, deletedCount: result.deletedCount });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar quinielas.", error });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
