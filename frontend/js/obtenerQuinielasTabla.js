let _jornada = null;
let _ranking = [];

// Nombre de quien acaba de enviar su quiniela (?yo=Nombre).
const _yo = new URLSearchParams(location.search).get('yo');

function normalizar(nombre = '') {
    return String(nombre).normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/\s+/g, ' ').trim();
}

function esYo(nombre) {
    return _yo && normalizar(nombre) === normalizar(_yo);
}

function medalla(posicion) {
    return posicion === 1 ? 'medalla-oro'
         : posicion === 2 ? 'medalla-plata'
         : posicion === 3 ? 'medalla-bronce'
         : '';
}

function chipsQuiniela(q, partidosJornada) {
    return q.partidos.map((p, i) => {
        const cls = p.pendiente ? 'chip-pending' : p.correcto ? 'chip-ok' : 'chip-fail';
        const partido = partidosJornada[i];
        const title = partido ? `${partido.local} vs ${partido.visita}` : '';
        return `<span class="chip ${cls}" title="${escapeHTML(title)}">${letraResultado(p.resultado)}</span>`;
    }).join('');
}

function tarjetaQuiniela(q, partidosJornada) {
    return `
        <div class="quiniela-card ${esYo(q.nombre) ? 'quiniela-card--yo' : ''}">
            <div class="card-header">
                <span class="card-rank ${medalla(q.posicion)}">#${q.posicion}</span>
                <span class="card-nombre">${escapeHTML(q.nombre)}${esYo(q.nombre) ? ' <span class="badge-yo">Tú</span>' : ''}</span>
                <span class="card-score">${q.aciertos}<span class="score-total">/${q.partidos.length}</span></span>
            </div>
            <div class="card-chips">${chipsQuiniela(q, partidosJornada)}</div>
        </div>`;
}

async function obtenerQuinielasTabla() {
    try {
        const res  = await fetchWithRetry(`${apiURL}/ranking`);
        const data = await res.json();

        if (!res.ok || !data.jornada) {
            document.getElementById('tabla-container').innerHTML = '<p class="aviso">No hay jornada configurada.</p>';
            document.getElementById('cards-container').innerHTML = '';
            document.getElementById('vista-toggle').style.display = 'none';
            document.querySelector('h1').textContent = 'Resultados';
        } else {
            _jornada = data.jornada;
            _ranking = data.ranking;
            document.querySelector('h1').textContent = `Jornada ${_jornada.numero}`;

            if (_ranking.length === 0) {
                document.getElementById('cards-container').innerHTML = '<p class="aviso">Aún no hay quinielas en esta jornada.</p>';
            } else {
                renderTabla();
                renderCards();
            }
            mostrarCompartir();
        }

        cargarHistorial(_jornada ? _jornada.numero : null);
        cargarTablaGeneral();

    } catch (error) {
        toast('Error al obtener las quinielas.', 'error');
        console.error(error);
    }
}

// ── TABLA ─────────────────────────────────────────────────────────────────────
function renderTabla() {
    const trHeader = document.querySelector('.tr-header');
    trHeader.innerHTML = '<th class="col-sticky-left">Participantes</th>' +
        _jornada.partidos.map(p => `
            <th>
                <div class="header-partido">
                    <img src="./img/${escapeHTML(p.localImg)}" alt="${escapeHTML(p.local)}" title="${escapeHTML(p.local)}">
                    <img src="./img/${escapeHTML(p.visitaImg)}" alt="${escapeHTML(p.visita)}" title="${escapeHTML(p.visita)}">
                </div>
            </th>`).join('') +
        '<th class="col-sticky-right">Pts</th>';

    document.getElementById('quiniela').innerHTML = _ranking.map(q => `
        <tr class="${esYo(q.nombre) ? 'fila-yo' : ''}">
            <td class="col-sticky-left">${escapeHTML(q.nombre)}</td>
            ${q.partidos.map(p => `<td class="${p.correcto ? 'ganador' : ''}">${letraResultado(p.resultado)}</td>`).join('')}
            <td class="col-sticky-right">${q.aciertos}</td>
        </tr>`).join('');
}

// ── TARJETAS ──────────────────────────────────────────────────────────────────
function renderCards() {
    document.getElementById('cards-container').innerHTML =
        _ranking.map(q => tarjetaQuiniela(q, _jornada.partidos)).join('');

    const mia = document.querySelector('.quiniela-card--yo');
    if (mia) setTimeout(() => mia.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
}

// ── TOGGLE VISTA ──────────────────────────────────────────────────────────────
function setVista(vista) {
    const tablaContainer = document.getElementById('tabla-container');
    const cardsContainer = document.getElementById('cards-container');
    const esTabla = vista === 'tabla';

    tablaContainer.classList.toggle('visible', esTabla);
    cardsContainer.style.display = esTabla ? 'none' : 'flex';
    document.getElementById('btn-tabla').classList.toggle('activo', esTabla);
    document.getElementById('btn-cards').classList.toggle('activo', !esTabla);
}

// ── COMPARTIR ─────────────────────────────────────────────────────────────────
function mostrarCompartir() {
    if (!_yo) return;
    const barra = document.getElementById('compartir-bar');
    if (!barra) return;

    const urlQuiniela = new URL('./llenarQuiniela.html', location.href).href;
    const texto = `¡Ya llené mi quiniela de la Jornada ${_jornada.numero}! ⚽ Llena la tuya aquí: ${urlQuiniela}`;
    document.getElementById('btn-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    barra.style.display = 'flex';
}

// ── TABLA GENERAL ─────────────────────────────────────────────────────────────
async function cargarTablaGeneral() {
    const section   = document.getElementById('general-section');
    const container = document.getElementById('general-container');
    if (!section) return;

    try {
        const res  = await fetchWithRetry(`${apiURL}/rankingGeneral`);
        const data = await res.json();
        const ranking = data.ranking || [];
        if (ranking.length === 0) return;

        section.style.display = 'block';
        container.innerHTML = `
            <div class="general-tabla">
                <div class="general-row general-row--header">
                    <span>#</span><span>Participante</span><span>Jornadas</span><span>Pts</span>
                </div>
                ${ranking.map(r => `
                    <div class="general-row ${esYo(r.nombre) ? 'fila-yo' : ''}">
                        <span class="card-rank ${medalla(r.posicion)}">${r.posicion}</span>
                        <span class="general-nombre">${escapeHTML(r.nombre)}</span>
                        <span>${r.jornadas}</span>
                        <span class="general-pts">${r.puntos}</span>
                    </div>`).join('')}
            </div>`;
    } catch {
        container.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar la tabla general.</p>';
    }
}

// ── HISTORIAL ─────────────────────────────────────────────────────────────────
async function cargarHistorial(jornadaActualNum) {
    const section   = document.getElementById('historial-section');
    const container = document.getElementById('historial-container');

    try {
        const res  = await fetchWithRetry(`${apiURL}/getAllJornadas`);
        const data = await res.json();
        const pasadas = (data.jornadas || []).filter(j => j.numero !== jornadaActualNum);

        if (pasadas.length === 0) return;

        section.style.display = 'block';
        container.innerHTML = '';

        pasadas.forEach(jornada => {
            const totalPartidos   = jornada.partidos.length;
            const resultadosCount = jornada.partidos.filter(p => p.resultado).length;
            const estadoBadge     = resultadosCount === totalPartidos
                ? '<span class="historial-badge historial-badge-ok">Finalizada</span>'
                : `<span class="historial-badge historial-badge-pending">${resultadosCount}/${totalPartidos} resultados</span>`;

            const item = document.createElement('div');
            item.className = 'historial-item';
            item.innerHTML = `
                <button class="historial-header" type="button" aria-expanded="false">
                    <span class="historial-header-titulo">
                        <i class="fa-solid fa-calendar-days"></i> Jornada ${Number(jornada.numero)}
                    </span>
                    ${estadoBadge}
                    <span class="historial-partidos-count">${totalPartidos} partidos</span>
                    <i class="fa-solid fa-chevron-down historial-chevron"></i>
                </button>
                <div class="historial-body" data-loaded="false">
                    <p class="aviso"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</p>
                </div>`;
            item.querySelector('.historial-header')
                .addEventListener('click', e => toggleHistorialItem(e.currentTarget, jornada.numero));
            container.appendChild(item);
        });

    } catch {
        container.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar el historial.</p>';
    }
}

async function toggleHistorialItem(btn, jornadaNum) {
    const item   = btn.closest('.historial-item');
    const body   = item.querySelector('.historial-body');
    const abrir  = !item.classList.contains('abierto');

    item.classList.toggle('abierto', abrir);
    btn.setAttribute('aria-expanded', String(abrir));

    if (abrir && body.dataset.loaded === 'false') {
        body.dataset.loaded = 'true';
        await renderHistorialJornada(body, jornadaNum);
    }
}

async function renderHistorialJornada(body, jornadaNum) {
    try {
        const res  = await fetchWithRetry(`${apiURL}/ranking?jornada=${encodeURIComponent(jornadaNum)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const { jornada, ranking } = data;
        if (ranking.length === 0) {
            body.innerHTML = '<p class="aviso">No hay quinielas para esta jornada.</p>';
            return;
        }

        const resultChips = jornada.partidos.map(p => {
            const cls = p.resultado ? `chip chip-oficial-${p.resultado}` : 'chip chip-pending';
            return `<span class="${cls}" title="${escapeHTML(`${p.local} vs ${p.visita}`)}">${letraResultado(p.resultado)}</span>`;
        }).join('');

        body.innerHTML = `
            <div class="historial-oficiales">
                <span class="historial-oficiales-label">Resultados oficiales</span>
                <div class="card-chips">${resultChips}</div>
            </div>
            <div class="historial-cards">
                ${ranking.map(q => tarjetaQuiniela(q, jornada.partidos)).join('')}
            </div>`;

    } catch {
        body.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar quinielas.</p>';
    }
}

obtenerQuinielasTabla();
