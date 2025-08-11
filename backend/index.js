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

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Conectado");
    console.log("Usando URI:", process.env.MONGO_URI);
    console.log("Base de datos:", mongoose.connection.name);
})
.catch(error => console.log(error.message));

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const QuinielaSchema = new mongoose.Schema({
    partidos: [
        {
            local: { type: String, required: true },   // equipo local
            visita: { type: String, required: true },  // equipo visitante
            resultado: { type: String, enum: ['local', 'empate', 'visita'], required: true }
        }
    ],
    nombre: {type: String}
    });

const Quiniela = mongoose.model('Quiniela', QuinielaSchema);

app.get('/', (req, res) => {
    res.json({
        message: "Bienvenido"
    });
});

app.get('/getQuiniela', async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store');

        const quinielas = await Quiniela.find();

        return res.status(200).json({
            message: "Resultados obtenidos con éxito.",
            quinielas: quinielas
        });
    } catch(error) {
        return res.status(500).json({
            message: "Error al consultar Resultados.",
            error: error
        });
    }
});

app.post('/newQuiniela', async (req, res) => {
    try {
        console.log("Body recibido:", req.body);
        const {nombre, partidos} = req.body;

        // Validar datos básicos
        if (!nombre || !Array.isArray(partidos) || partidos.length !== 9) {
            return res.status(400).json({
                message: "Datos inválidos. Debes enviar nombre y exactamente 9 partidos."
            });
        }

        // Validar estructura de cada partido
        for (const partido of partidos) {
            if (!partido.local || !partido.visita || !['local', 'empate', 'visita'].includes(partido.resultado)) {
                return res.status(400).json({
                    message: "Cada partido debe tener local, visita y un resultado válido (local, empate, visita)."
                });
            }
        }

        const newQuiniela = new Quiniela({nombre, partidos});

        await newQuiniela.save();
        
        return res.status(200).json({
            message: "Quiniela creada con éxito."
        });
    } catch(error) {
        return res.status(500).json({
            message: "Error al crear Quiniela.",
            error: error
        });
    }
});

app.delete('/deleteQuiniela/:quinielaId', async (req, res) => {
    try {
        const quinielaId = req.params.quinielaId;
        console.log("DELETE request id:", quinielaId);

        if (!mongoose.Types.ObjectId.isValid(quinielaId)) {
            return res.status(400).json({ message: "ID inválido" });
        }

        const deleted = await Quiniela.findByIdAndDelete(quinielaId);

        if (!deleted) {
            console.log("No se encontró el documento en la DB.");
            return res.status(404).json({ message: "Quiniela no encontrada." });
        }

        console.log("Documento eliminado:", deleted._id.toString());
        return res.status(200).json({ message: "Quiniela eliminada con éxito.", deleted });
    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar Quiniela.", error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
