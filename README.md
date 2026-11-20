# Quiniela Liga MX

Aplicación web para organizar una quiniela de la Liga MX entre amigos: los participantes eligen
local / empate / visita para cada partido de la jornada, el admin captura los resultados oficiales
y la página calcula la clasificación por jornada y la tabla general.

## Estructura

```
backend/            API REST (Node.js + Express + MongoDB)
  index.js          Arranque: valida variables, conecta a MongoDB y levanta el servidor
  app.js            Configuración de Express (CORS, rate limit, rutas, errores)
  config.js         Lectura de variables de entorno
  models/           Esquemas de Mongoose (Jornada, Quiniela)
  routes/           Endpoints (auth, jornadas, quinielas)
  middleware/       Autenticación, validación y manejo de errores
  lib/              Lógica pura: ranking, fechas, normalización, esquemas zod
  test/             Pruebas (node:test + supertest)
frontend/           Sitio estático (HTML + CSS + JS sin frameworks)
  js/config.js      URL de la API y fetch con reintentos
  js/ui.js          Utilidades: escapeHTML, toasts, modal de confirmación, formatos
  js/equipos.js     Catálogo de equipos para el panel de admin
```

## Puesta en marcha

### Backend

```bash
cd backend
cp .env.example .env     # y llena MONGO_URI, JWT_SECRET y ADMIN_PASSWORD
npm install
npm run dev              # desarrollo con recarga automática
npm start                # producción
npm test                 # pruebas
```

### Frontend

Es un sitio estático. Sírvelo con cualquier servidor (por ejemplo, la extensión Live Server de VS Code)
y ajusta `apiURL` en [frontend/js/config.js](frontend/js/config.js) si el backend no está en Render.

Recuerda poner el dominio del frontend en `ALLOWED_ORIGINS` del backend.

## Funcionamiento

- **Envíos:** se cierran automáticamente al iniciar el primer partido de la jornada
  (según `TZ_OFFSET`, por defecto hora del centro de México). El admin también puede cerrarlos a mano.
- **Nombres:** no se permiten dos quinielas con el mismo nombre en una jornada
  (sin distinguir mayúsculas ni acentos).
- **Clasificación:** quienes empatan en puntos comparten posición (1, 1, 3…).
- **Tabla general:** suma los aciertos de todas las jornadas agrupando por nombre.
- **Privacidad:** los endpoints públicos nunca devuelven el celular; solo `/admin/quinielas` (con token).

## Endpoints principales

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/verifyAdmin` | público (5 intentos / 15 min) | Devuelve token JWT de admin |
| GET | `/getJornada` | público | Jornada activa con `aceptaEnvios` y `cierreEnvios` |
| GET | `/getAllJornadas` | público | Todas las jornadas |
| POST | `/newQuiniela` | público (20 envíos / 15 min) | Registra una quiniela en la jornada activa |
| GET | `/ranking?jornada=N` | público | Clasificación de una jornada (por defecto la activa) |
| GET | `/rankingGeneral` | público | Tabla general acumulada |
| GET | `/getQuiniela?jornada=N` | público | Quinielas sin datos de contacto |
| GET | `/admin/quinielas?jornada=N` | admin | Quinielas con celular y estado de pago |
| PUT | `/setJornada` | admin | Crea o edita una jornada |
| PUT | `/setResultados` | admin | Captura resultados oficiales |
| PUT | `/toggleEnvios` | admin | Abre/cierra envíos manualmente |
| PUT | `/archivarJornada` | admin | Mueve la jornada al historial |
| PATCH | `/updatePago/:id` | admin | Marca pago como pendiente/pagado |
| DELETE | `/deleteQuiniela/:id` | admin | Elimina una quiniela |
| DELETE | `/deleteJornada` | admin | Elimina una jornada y sus quinielas |
| DELETE | `/deleteHistorial` | admin | Elimina jornadas archivadas y sus quinielas |
