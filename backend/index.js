const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3000;

mongoose.connect('mongodb+srv://root:50KA36aNuH1sNyZV@quiniela.8suihry.mongodb.net/?retryWrites=true&w=majority&appName=Quiniela')
.then(() => console.log("MongoDB Conectado"))
.catch(error => console.log(error.message));

app.use(express.json());
app.use(cors());

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

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
