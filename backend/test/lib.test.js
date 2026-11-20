const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizarNombre } = require('../lib/texto');
const { aFecha, cierreEnvios, aceptaEnvios } = require('../lib/fechas');
const { calcularRanking, calcularRankingGeneral } = require('../lib/ranking');
const schemas = require('../lib/schemas');

test('normalizarNombre quita acentos, mayúsculas y espacios extra', () => {
    assert.equal(normalizarNombre('  José   Pérez '), 'jose perez');
    assert.equal(normalizarNombre('JOSE PEREZ'), normalizarNombre('josé pérez'));
});

test('aFecha interpreta la hora con el offset de México', () => {
    assert.equal(aFecha('2026-03-01', '19:00', '-06:00').toISOString(), '2026-03-02T01:00:00.000Z');
    assert.equal(aFecha('xx', '19:00'), null);
});

test('cierreEnvios es el inicio del primer partido', () => {
    const jornada = { partidos: [
        { fecha: '2026-03-02', hora: '17:00' },
        { fecha: '2026-03-01', hora: '21:00' },
    ] };
    assert.equal(cierreEnvios(jornada, '-06:00').toISOString(), '2026-03-02T03:00:00.000Z');
});

test('aceptaEnvios respeta el cierre manual y el automático', () => {
    const jornada = { enviosAbiertos: true, partidos: [{ fecha: '2026-03-01', hora: '19:00' }] };
    assert.equal(aceptaEnvios(jornada, new Date('2026-03-01T12:00:00Z'), '-06:00'), true);
    assert.equal(aceptaEnvios(jornada, new Date('2026-03-02T01:00:00Z'), '-06:00'), false);
    assert.equal(aceptaEnvios({ ...jornada, enviosAbiertos: false }, new Date('2026-03-01T12:00:00Z'), '-06:00'), false);
});

const jornada = {
    numero: 1,
    partidos: [
        { local: 'A', visita: 'B', resultado: 'local' },
        { local: 'C', visita: 'D', resultado: 'empate' },
        { local: 'E', visita: 'F', resultado: '' },
    ],
};
const q = (nombre, resultados, extra = {}) => ({
    _id: nombre, nombre, jornada: 1,
    partidos: resultados.map((r, i) => ({ ...jornada.partidos[i], resultado: r })),
    ...extra,
});

test('calcularRanking cuenta aciertos e ignora partidos sin resultado', () => {
    const [primero] = calcularRanking(jornada, [q('Ana', ['local', 'empate', 'visita'])]);
    assert.equal(primero.aciertos, 2);
    assert.deepEqual(primero.partidos.map(p => p.pendiente), [false, false, true]);
});

test('calcularRanking comparte posición en empates (1, 1, 3)', () => {
    const ranking = calcularRanking(jornada, [
        q('Beto', ['local', 'local', 'local']),
        q('Ana',  ['local', 'empate', 'local']),
        q('Caro', ['local', 'local', 'local']),
        q('Dani', ['visita', 'local', 'local']),
    ]);
    assert.deepEqual(ranking.map(r => [r.nombre, r.posicion]),
        [['Ana', 1], ['Beto', 2], ['Caro', 2], ['Dani', 4]]);
});

test('calcularRankingGeneral acumula por nombre normalizado', () => {
    const j2 = { numero: 2, partidos: [{ local: 'A', visita: 'B', resultado: 'visita' }] };
    const general = calcularRankingGeneral([jornada, j2], [
        q('Ana', ['local', 'empate', 'local']),
        { _id: 'x', nombre: 'ANA', jornada: 2, partidos: [{ local: 'A', visita: 'B', resultado: 'visita' }] },
        q('Beto', ['local', 'local', 'local']),
    ]);
    assert.deepEqual(general.map(g => [g.puntos, g.jornadas, g.posicion]), [[3, 2, 1], [1, 1, 2]]);
});

test('el esquema de nombre rechaza HTML y nombres largos', () => {
    const base = { partidos: [{ local: 'A', visita: 'B', resultado: 'local' }] };
    assert.equal(schemas.nuevaQuiniela.safeParse({ ...base, nombre: '<img src=x onerror=alert(1)>' }).success, false);
    assert.equal(schemas.nuevaQuiniela.safeParse({ ...base, nombre: 'a'.repeat(41) }).success, false);
    const ok = schemas.nuevaQuiniela.safeParse({ ...base, nombre: "  María   O'Neil-Pérez " });
    assert.equal(ok.success, true);
    assert.equal(ok.data.nombre, "María O'Neil-Pérez");
});

test('setJornada rechaza equipos repetidos', () => {
    const p = (localImg, visitaImg) => ({ local: 'x', localImg, visita: 'y', visitaImg, fecha: '2026-03-01', hora: '19:00' });
    assert.equal(schemas.setJornada.safeParse({ numero: 1, partidos: [p('a.png', 'b.png'), p('a.png', 'c.png')] }).success, false);
    assert.equal(schemas.setJornada.safeParse({ numero: 1, partidos: [p('a.png', 'a.png')] }).success, false);
    assert.equal(schemas.setJornada.safeParse({ numero: 1, partidos: [p('a.png', 'b.png'), p('c.png', 'd.png')] }).success, true);
});
