let _jornada    = null;
let _quinielas  = [];
let _todasJornadas = [];

async function obtenerQuinielasTabla() {
    try {
        // 1. Jornada actual
        const jornadaRes  = await fetchWithRetry(`${apiURL}/getJornada`);
        const jornadaData = await jornadaRes.json();
        _jornada = jornadaData.jornada;

        if (!_jornada) {
            document.getElementById('tabla-container').innerHTML =
                '<p class="aviso">No hay jornada configurada.</p>';
            document.getElementById('cards-container').innerHTML = '';
            document.getElementById('vista-toggle').style.display = 'none';
            document.querySelector('h1').textContent = 'Resultados';
        } else {
            document.querySelector('h1').textContent = `Jornada ${_jornada.numero}`;

            // 2. Quinielas de esta jornada
            const quinRes  = await fetchWithRetry(`${apiURL}/getQuiniela?jornada=${_jornada.numero}`);
            const quinData = await quinRes.json();
            _quinielas = quinData.quinielas;

            renderTabla();
            renderCards();
        }

        // 3. Historial (siempre, independiente de si hay jornada actual)
        cargarHistorial(_jornada ? _jornada.numero : null);

    } catch (error) {
        alert("Error al obtener las Quinielas.");
        console.error(error);
    }
}

// ── TABLA ─────────────────────────────────────────────────────────────────────
function renderTabla() {
    const trHeader = document.querySelector('.tr-header');
    trHeader.innerHTML = '<th class="col-sticky-left">Participantes</th>';

    _jornada.partidos.forEach(p => {
        const th = document.createElement('th');
        th.innerHTML = `
            <div class="header-partido">
                <img src="./img/${p.localImg}" alt="${p.local}">
                <img src="./img/${p.visitaImg}" alt="${p.visita}">
            </div>`;
        trHeader.appendChild(th);
    });

    const thAciertos = document.createElement('th');
    thAciertos.textContent = 'Pts';
    thAciertos.className = 'col-sticky-right';
    trHeader.appendChild(thAciertos);

    const resultadosOficiales = _jornada.partidos.map(p => p.resultado);
    const tbody = document.getElementById('quiniela');
    tbody.innerHTML = '';

    _quinielas.forEach(q => {
        const tr  = document.createElement('tr');
        let aciertos = 0;

        const tdNombre = document.createElement('td');
        tdNombre.textContent = q.nombre;
        tdNombre.className   = 'col-sticky-left';
        tr.appendChild(tdNombre);

        q.partidos.forEach((p, i) => {
            const td    = document.createElement('td');
            const letra = p.resultado === 'local' ? 'L' : p.resultado === 'empate' ? 'E' : 'V';
            td.textContent = letra;

            if (resultadosOficiales[i] && p.resultado === resultadosOficiales[i]) {
                td.classList.add('ganador');
                aciertos++;
            }
            tr.appendChild(td);
        });

        const tdAciertos = document.createElement('td');
        tdAciertos.textContent = aciertos;
        tdAciertos.className   = 'col-sticky-right';
        tr.appendChild(tdAciertos);

        tbody.appendChild(tr);
    });
}

// ── TARJETAS ──────────────────────────────────────────────────────────────────
function renderCards() {
    const resultadosOficiales = _jornada.partidos.map(p => p.resultado);

    const clasificados = _quinielas.map(q => {
        let aciertos = 0;
        const partidos = q.partidos.map((p, i) => {
            const correcto    = !!(resultadosOficiales[i] && p.resultado === resultadosOficiales[i]);
            const sinOficial  = !resultadosOficiales[i];
            if (correcto) aciertos++;
            return { ...p, correcto, sinOficial };
        });
        return { ...q, partidos, aciertos };
    }).sort((a, b) => b.aciertos - a.aciertos);

    const container = document.getElementById('cards-container');
    container.innerHTML = clasificados.map((q, idx) => {
        const chips = q.partidos.map((p, i) => {
            const letra = p.resultado === 'local' ? 'L' : p.resultado === 'empate' ? 'E' : 'V';
            const cls   = p.sinOficial ? 'chip-pending'
                        : p.correcto  ? 'chip-ok'
                        : 'chip-fail';
            const logo  = _jornada.partidos[i];
            const title = `${logo.local} vs ${logo.visita}`;
            return `<span class="chip ${cls}" title="${title}">${letra}</span>`;
        }).join('');

        const medallaClass = idx === 0 ? 'medalla-oro'
                           : idx === 1 ? 'medalla-plata'
                           : idx === 2 ? 'medalla-bronce'
                           : '';

        return `
            <div class="quiniela-card">
                <div class="card-header">
                    <span class="card-rank ${medallaClass}">#${idx + 1}</span>
                    <span class="card-nombre">${q.nombre}</span>
                    <span class="card-score">${q.aciertos}<span class="score-total">/${q.partidos.length}</span></span>
                </div>
                <div class="card-chips">${chips}</div>
            </div>`;
    }).join('');
}

// ── TOGGLE VISTA ──────────────────────────────────────────────────────────────
function setVista(vista) {
    const tablaContainer = document.getElementById('tabla-container');
    const cardsContainer = document.getElementById('cards-container');
    const btnTabla       = document.getElementById('btn-tabla');
    const btnCards       = document.getElementById('btn-cards');

    if (vista === 'tabla') {
        tablaContainer.classList.add('visible');
        cardsContainer.style.display = 'none';
        btnTabla.classList.add('activo');
        btnCards.classList.remove('activo');
    } else {
        tablaContainer.classList.remove('visible');
        cardsContainer.style.display = 'flex';
        btnCards.classList.add('activo');
        btnTabla.classList.remove('activo');
    }
}

// ── HISTORIAL ─────────────────────────────────────────────────────────────────
async function cargarHistorial(jornadaActualNum) {
    const section   = document.getElementById('historial-section');
    const container = document.getElementById('historial-container');

    try {
        const res  = await fetchWithRetry(`${apiURL}/getAllJornadas`);
        const data = await res.json();
        _todasJornadas = data.jornadas;

        const pasadas = _todasJornadas.filter(j => j.numero !== jornadaActualNum);

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
                <button class="historial-header" onclick="toggleHistorialItem(this, ${jornada.numero})">
                    <span class="historial-header-titulo">
                        <i class="fa-solid fa-calendar-days"></i> Jornada ${jornada.numero}
                    </span>
                    ${estadoBadge}
                    <span class="historial-partidos-count">${totalPartidos} partidos</span>
                    <i class="fa-solid fa-chevron-down historial-chevron"></i>
                </button>
                <div class="historial-body" data-loaded="false">
                    <p class="aviso"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</p>
                </div>`;
            container.appendChild(item);
        });

    } catch {
        container.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar el historial.</p>';
    }
}

async function toggleHistorialItem(btn, jornadaNum) {
    const item   = btn.closest('.historial-item');
    const body   = item.querySelector('.historial-body');
    const isOpen = item.classList.contains('abierto');

    item.classList.toggle('abierto');

    if (!isOpen && body.dataset.loaded === 'false') {
        body.dataset.loaded = 'true';
        await renderHistorialJornada(body, jornadaNum);
    }
}

async function renderHistorialJornada(body, jornadaNum) {
    const jornada = _todasJornadas.find(j => j.numero === jornadaNum);
    if (!jornada) {
        body.innerHTML = '<p class="aviso">Error: jornada no encontrada.</p>';
        return;
    }

    try {
        const res  = await fetchWithRetry(`${apiURL}/getQuiniela?jornada=${jornadaNum}`);
        const data = await res.json();
        const quinielas = data.quinielas;

        if (!quinielas || quinielas.length === 0) {
            body.innerHTML = '<p class="aviso">No hay quinielas para esta jornada.</p>';
            return;
        }

        const resultadosOficiales = jornada.partidos.map(p => p.resultado);

        // Fila de resultados oficiales
        const resultChips = jornada.partidos.map((p, i) => {
            const r     = p.resultado;
            const label = r === 'local' ? 'L' : r === 'empate' ? 'E' : r === 'visita' ? 'V' : '—';
            const cls   = r === 'local'  ? 'chip chip-oficial-local'
                        : r === 'empate' ? 'chip chip-oficial-empate'
                        : r === 'visita' ? 'chip chip-oficial-visita'
                        : 'chip chip-pending';
            return `<span class="${cls}" title="${p.local} vs ${p.visita}">${label}</span>`;
        }).join('');

        // Clasificación
        const clasificados = quinielas.map(q => {
            let aciertos = 0;
            const partidos = q.partidos.map((p, i) => {
                const correcto   = !!(resultadosOficiales[i] && p.resultado === resultadosOficiales[i]);
                const sinOficial = !resultadosOficiales[i];
                if (correcto) aciertos++;
                return { ...p, correcto, sinOficial };
            });
            return { ...q, partidos, aciertos };
        }).sort((a, b) => b.aciertos - a.aciertos);

        body.innerHTML = `
            <div class="historial-oficiales">
                <span class="historial-oficiales-label">Resultados oficiales</span>
                <div class="card-chips">${resultChips}</div>
            </div>
            <div class="historial-cards">
                ${clasificados.map((q, idx) => {
                    const chips = q.partidos.map((p, i) => {
                        const letra = p.resultado === 'local' ? 'L' : p.resultado === 'empate' ? 'E' : 'V';
                        const cls   = p.sinOficial ? 'chip-pending' : p.correcto ? 'chip-ok' : 'chip-fail';
                        const partido = jornada.partidos[i];
                        const title = partido ? `${partido.local} vs ${partido.visita}` : '';
                        return `<span class="chip ${cls}" title="${title}">${letra}</span>`;
                    }).join('');

                    const medallaClass = idx === 0 ? 'medalla-oro'
                                       : idx === 1 ? 'medalla-plata'
                                       : idx === 2 ? 'medalla-bronce' : '';

                    return `
                        <div class="quiniela-card">
                            <div class="card-header">
                                <span class="card-rank ${medallaClass}">#${idx + 1}</span>
                                <span class="card-nombre">${q.nombre}</span>
                                <span class="card-score">${q.aciertos}<span class="score-total">/${q.partidos.length}</span></span>
                            </div>
                            <div class="card-chips">${chips}</div>
                        </div>`;
                }).join('')}
            </div>`;

    } catch {
        body.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar quinielas.</p>';
    }
}

obtenerQuinielasTabla();
