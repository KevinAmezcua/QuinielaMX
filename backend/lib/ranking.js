const { normalizarNombre } = require('./texto');

// Asigna posiciones con empates estilo "1, 1, 3": quien empata comparte lugar.
// Espera una lista ya ordenada de mayor a menor por `campo`.
function asignarPosiciones(lista, campo) {
    let posicion = 0;
    let anterior = null;
    return lista.map((item, i) => {
        if (item[campo] !== anterior) {
            posicion = i + 1;
            anterior = item[campo];
        }
        return { ...item, posicion };
    });
}

// Calcula aciertos de cada quiniela contra los resultados oficiales de la jornada.
function calcularRanking(jornada, quinielas) {
    const oficiales = (jornada?.partidos || []).map(p => p.resultado || '');

    const calificadas = quinielas.map(q => {
        let aciertos = 0;
        const partidos = (q.partidos || []).map((p, i) => {
            const pendiente = !oficiales[i];
            const correcto  = !pendiente && p.resultado === oficiales[i];
            if (correcto) aciertos++;
            return { local: p.local, visita: p.visita, resultado: p.resultado, correcto, pendiente };
        });
        return { _id: String(q._id), nombre: q.nombre, jornada: q.jornada, partidos, aciertos };
    });

    // Orden estable: por aciertos y, en empate, alfabético.
    calificadas.sort((a, b) =>
        b.aciertos - a.aciertos || String(a.nombre).localeCompare(String(b.nombre), 'es'));

    return asignarPosiciones(calificadas, 'aciertos');
}

// Suma los aciertos de cada participante a lo largo de todas las jornadas.
function calcularRankingGeneral(jornadas, quinielas) {
    const porNumero = new Map(jornadas.map(j => [j.numero, j]));
    const acumulado = new Map();

    for (const q of quinielas) {
        const jornada = porNumero.get(q.jornada);
        if (!jornada) continue;
        const [calificada] = calcularRanking(jornada, [q]);
        const clave = q.nombreNormalizado || normalizarNombre(q.nombre);
        const actual = acumulado.get(clave) || { nombre: q.nombre, puntos: 0, jornadas: 0 };
        actual.puntos   += calificada.aciertos;
        actual.jornadas += 1;
        acumulado.set(clave, actual);
    }

    const lista = [...acumulado.values()].sort((a, b) =>
        b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, 'es'));

    return asignarPosiciones(lista, 'puntos');
}

module.exports = { asignarPosiciones, calcularRanking, calcularRankingGeneral };
