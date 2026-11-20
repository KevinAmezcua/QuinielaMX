// Pruebas de endpoints sin base de datos: los métodos de los modelos se sustituyen por stubs.
process.env.JWT_SECRET = 'secreto-de-prueba';
process.env.ADMIN_PASSWORD = 'clave-de-prueba';
process.env.TZ_OFFSET = '-06:00';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const Jornada  = require('../models/Jornada');
const Quiniela = require('../models/Quiniela');
const { createApp } = require('../app');

const app = createApp();

const enUnaSemana = new Date(Date.now() + 7 * 24 * 3600 * 1000);
const fecha = enUnaSemana.toISOString().slice(0, 10);

const jornadaActiva = {
    numero: 5,
    enviosAbiertos: true,
    partidos: [
        { local: 'América', visita: 'Chivas', fecha, hora: '19:00', resultado: '' },
        { local: 'Pumas',   visita: 'Toluca', fecha, hora: '21:00', resultado: '' },
    ],
};

const quinielaValida = {
    nombre: 'Ana López',
    partidos: [
        { local: 'América', visita: 'Chivas', resultado: 'local' },
        { local: 'Pumas',   visita: 'Toluca', resultado: 'empate' },
    ],
};

let guardadas;
test.beforeEach(() => {
    guardadas = [];
    Jornada.activa = async () => jornadaActiva;
    Quiniela.exists = async () => null;
    Quiniela.prototype.save = async function () { guardadas.push(this.toObject()); return this; };
});

test('verifyAdmin rechaza contraseña incorrecta y acepta la correcta', async () => {
    await request(app).post('/verifyAdmin').send({ password: 'mala' }).expect(401);
    const res = await request(app).post('/verifyAdmin').send({ password: 'clave-de-prueba' }).expect(200);
    assert.ok(res.body.token);
});

test('endpoints de admin exigen token', async () => {
    await request(app).delete('/deleteQuiniela/123').expect(401);
    await request(app).get('/admin/quinielas?jornada=1').expect(401);
    await request(app).put('/setJornada').set('Authorization', 'Bearer basura').send({}).expect(401);
});

test('newQuiniela guarda en la jornada activa e ignora la jornada del cliente', async () => {
    await request(app).post('/newQuiniela').send({ ...quinielaValida, jornada: 1 }).expect(200);
    assert.equal(guardadas.length, 1);
    assert.equal(guardadas[0].jornada, 5);
    assert.equal(guardadas[0].nombreNormalizado, 'ana lopez');
});

test('newQuiniela rechaza nombres con HTML', async () => {
    const res = await request(app).post('/newQuiniela')
        .send({ ...quinielaValida, nombre: '<script>alert(1)</script>' }).expect(400);
    assert.match(res.body.message, /nombre/i);
    assert.equal(guardadas.length, 0);
});

test('newQuiniela rechaza partidos que no son de la jornada', async () => {
    const partidos = [...quinielaValida.partidos];
    partidos[1] = { local: 'Tigres', visita: 'Monterrey', resultado: 'local' };
    await request(app).post('/newQuiniela').send({ ...quinielaValida, partidos }).expect(400);
});

test('newQuiniela rechaza nombres duplicados', async () => {
    Quiniela.exists = async () => ({ _id: 'x' });
    await request(app).post('/newQuiniela').send(quinielaValida).expect(409);
});

test('newQuiniela rechaza envíos cuando la jornada está cerrada', async () => {
    Jornada.activa = async () => ({ ...jornadaActiva, enviosAbiertos: false });
    await request(app).post('/newQuiniela').send(quinielaValida).expect(403);

    Jornada.activa = async () => ({
        ...jornadaActiva,
        partidos: jornadaActiva.partidos.map(p => ({ ...p, fecha: '2020-01-01' })),
    });
    await request(app).post('/newQuiniela').send(quinielaValida).expect(403);
});

test('JSON inválido responde 400 sin detalles internos', async () => {
    const res = await request(app).post('/newQuiniela')
        .set('Content-Type', 'application/json').send('{malo').expect(400);
    assert.deepEqual(Object.keys(res.body), ['message']);
});
