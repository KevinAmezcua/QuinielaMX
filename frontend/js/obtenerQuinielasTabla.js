const apiURL = 'https://quinielamx.onrender.com';

let _jornada    = null;
let _quinielas  = [];

async function obtenerQuinielasTabla() {
    try {
        // 1. Jornada actual
        const jornadaRes  = await fetch(`${apiURL}/getJornada`);
        const jornadaData = await jornadaRes.json();
        _jornada = jornadaData.jornada;

        if (!_jornada) {
            document.getElementById('tabla-container').innerHTML =
                '<p class="aviso">No hay jornada configurada.</p>';
            document.getElementById('cards-container').innerHTML = '';
            document.getElementById('vista-toggle').style.display = 'none';
            return;
        }

        document.querySelector('h1').textContent = `Jornada ${_jornada.numero}`;

        // 2. Quinielas de esta jornada
        const quinRes  = await fetch(`${apiURL}/getQuiniela?jornada=${_jornada.numero}`);
        const quinData = await quinRes.json();
        _quinielas = quinData.quinielas;

        renderTabla();
        renderCards();

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

    // Calcular puntos y ordenar de mayor a menor
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

obtenerQuinielasTabla();
