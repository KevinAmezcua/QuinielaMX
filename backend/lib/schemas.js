const { z } = require('zod');

const RESULTADO = z.enum(['local', 'empate', 'visita']);
const numeroJornada = z.coerce.number().int().min(1).max(999);

// Letras (con acentos), números, espacios y . ' -  — evita HTML en el nombre.
const nombre = z.string()
    .transform(s => s.replace(/\s+/g, ' ').trim())
    .pipe(z.string()
        .min(2,  'El nombre debe tener al menos 2 caracteres.')
        .max(40, 'El nombre no puede tener más de 40 caracteres.')
        .regex(/^[\p{L}\p{N} .'-]+$/u, 'El nombre solo puede contener letras, números, espacios y . \' -'));

const nuevaQuiniela = z.object({
    nombre,
    partidos: z.array(z.object({
        local:     z.string().min(1).max(60),
        visita:    z.string().min(1).max(60),
        resultado: RESULTADO
    })).min(1).max(30)
});

const partidoJornada = z.object({
    local:     z.string().min(1).max(60),
    localImg:  z.string().regex(/^[\w\/.-]+\.(png|jpg|jpeg|svg|webp)$/i, 'Imagen inválida.'),
    visita:    z.string().min(1).max(60),
    visitaImg: z.string().regex(/^[\w\/.-]+\.(png|jpg|jpeg|svg|webp)$/i, 'Imagen inválida.'),
    fecha:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD).'),
    hora:      z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (HH:MM).')
}).refine(p => p.localImg !== p.visitaImg, { message: 'Un equipo no puede jugar contra sí mismo.' });

const setJornada = z.object({
    numero:   numeroJornada,
    partidos: z.array(partidoJornada).min(1).max(30)
}).refine(({ partidos }) => {
    const equipos = partidos.flatMap(p => [p.localImg, p.visitaImg]);
    return new Set(equipos).size === equipos.length;
}, { message: 'Un equipo no puede aparecer en más de un partido.' });

const setResultados = z.object({
    numero:     numeroJornada,
    resultados: z.array(z.union([RESULTADO, z.literal('')]))
});

const conNumero     = z.object({ numero: numeroJornada });
const updatePago    = z.object({ estadoPago: z.enum(['pendiente', 'pagado']) });
const queryJornada  = z.object({ jornada: numeroJornada.optional() });
const queryJornadaRequerida = z.object({ jornada: numeroJornada });
const verifyAdmin   = z.object({ password: z.string().min(1).max(200) });

module.exports = {
    nuevaQuiniela, setJornada, setResultados, conNumero,
    updatePago, queryJornada, queryJornadaRequerida, verifyAdmin
};
