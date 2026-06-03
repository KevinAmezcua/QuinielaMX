const apiURL = 'https://quinielamx.onrender.com';

let _jornadaActualNum = null;

function toggleAdminCard(h2) {
    h2.closest('.admin-card').classList.toggle('collapsed');
}

const EQUIPOS = [
    { nombre: 'América',           img: 'america.png' },
    { nombre: 'Atlas',             img: 'atlas.png' },
    { nombre: 'Chivas Guadalajara',img: 'chivas.png' },
    { nombre: 'Cruz Azul',         img: 'cruz_azul.png' },
    { nombre: 'FC Juárez',         img: 'juarez.png' },
    { nombre: 'León',              img: 'leon.png' },
    { nombre: 'Mazatlán',          img: 'mazatlan.png' },
    { nombre: 'Monterrey',         img: 'mty.png' },
    { nombre: 'Necaxa',            img: 'necaxa.png' },
    { nombre: 'Pachuca',           img: 'pachuca.png' },
    { nombre: 'Puebla FC',         img: 'puebla.png' },
    { nombre: 'Pumas UNAM',        img: 'pumas.png' },
    { nombre: 'Querétaro',         img: 'queretaro.png' },
    { nombre: 'Santos Laguna',     img: 'santos.png' },
    { nombre: 'Atlético San Luis', img: 'san_luis.png' },
    { nombre: 'Tigres UANL',       img: 'tigres.png' },
    { nombre: 'Tijuana',           img: 'xolos.png' },
    { nombre: 'Toluca',            img: 'toluca.png' }
];

function equipoOptions(selected = '') {
    return EQUIPOS.map(e =>
        `<option value="${e.img}" data-nombre="${e.nombre}" ${selected === e.img ? 'selected' : ''}>${e.nombre}</option>`
    ).join('');
}

function agregarPartido(localImg = '', visitaImg = '', fecha = '', hora = '') {
    const contenedor = document.getElementById('partidos-admin');
    const idx = contenedor.children.length;

    const div = document.createElement('div');
    div.className = 'partido-admin';
    div.innerHTML = `
        <span class="partido-num">${idx + 1}</span>
        <div class="partido-admin-equipo">
            <label>Local</label>
            <select class="local-select" onchange="previewTeam(this, 'local-img-${idx}')">
                <option value="">-- Equipo --</option>
                ${equipoOptions(localImg)}
            </select>
            <img id="local-img-${idx}" class="team-preview"
                 src="${localImg ? './img/' + localImg : ''}"
                 alt=""
                 style="${localImg ? '' : 'visibility:hidden'}">
        </div>
        <div class="partido-admin-centro">
            <input type="date" class="partido-fecha" value="${fecha}">
            <input type="time" class="partido-hora" value="${hora}">
        </div>
        <div class="partido-admin-equipo">
            <label>Visita</label>
            <select class="visita-select" onchange="previewTeam(this, 'visita-img-${idx}')">
                <option value="">-- Equipo --</option>
                ${equipoOptions(visitaImg)}
            </select>
            <img id="visita-img-${idx}" class="team-preview"
                 src="${visitaImg ? './img/' + visitaImg : ''}"
                 alt=""
                 style="${visitaImg ? '' : 'visibility:hidden'}">
        </div>
        <button class="btn-remove" onclick="this.closest('.partido-admin').remove(); renumerarPartidos()">
            <i class="fa-solid fa-trash"></i>
        </button>`;
    contenedor.appendChild(div);
}

function limpiarPartidos() {
    if (!confirm('¿Limpiar todos los partidos del formulario?')) return;
    document.getElementById('partidos-admin').innerHTML = '';
}

async function archivarJornada() {
    const password = document.getElementById('admin-password').value;
    const numero   = _jornadaActualNum;

    if (!numero) { alert("No hay jornada activa para archivar."); return; }

    if (!confirm(`¿Archivar la Jornada ${numero}?\n\nLos partidos y quinielas quedarán guardados en el historial pero ya no serán la jornada activa.`)) return;

    try {
        const res = await fetch(`${apiURL}/archivarJornada`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, numero })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.message);
            _jornadaActualNum = null;
            document.getElementById('partidos-admin').innerHTML = '';
            document.getElementById('jornada-numero').value = '';
            document.getElementById('resultados-admin').innerHTML = '';
            document.getElementById('jornada-actual-info').textContent = 'No hay jornada activa.';
            cargarQuinielasAdmin();
        } else {
            alert(data.message || "Error al archivar la jornada.");
        }
    } catch {
        alert("Error al conectar con el servidor.");
    }
}

function renumerarPartidos() {
    document.querySelectorAll('.partido-num').forEach((el, i) => {
        el.textContent = i + 1;
    });
}

function previewTeam(select, imgId) {
    const img = document.getElementById(imgId);
    if (!img) return;
    const opt = select.options[select.selectedIndex];
    if (select.value) {
        img.src = `./img/${select.value}`;
        img.alt = opt.dataset.nombre || '';
        img.style.visibility = 'visible';
    } else {
        img.style.visibility = 'hidden';
    }
}

async function guardarJornada() {
    const password = document.getElementById('admin-password').value;
    const numero = parseInt(document.getElementById('jornada-numero').value);

    if (!password) { alert("Ingresa la contraseña."); return; }
    if (!numero)   { alert("Ingresa el número de jornada."); return; }

    const filas = document.querySelectorAll('.partido-admin');
    const partidos = [];

    for (const fila of filas) {
        const localSel  = fila.querySelector('.local-select');
        const visitaSel = fila.querySelector('.visita-select');
        const fecha     = fila.querySelector('.partido-fecha').value;
        const hora      = fila.querySelector('.partido-hora').value;
        const localImg  = localSel.value;
        const visitaImg = visitaSel.value;
        const local     = localSel.options[localSel.selectedIndex]?.dataset.nombre || '';
        const visita    = visitaSel.options[visitaSel.selectedIndex]?.dataset.nombre || '';

        if (!localImg || !visitaImg || !fecha || !hora) {
            alert("Completa todos los campos de cada partido (equipos, fecha y hora).");
            return;
        }
        partidos.push({ local, localImg, visita, visitaImg, fecha, hora });
    }

    if (partidos.length === 0) {
        alert("Agrega al menos un partido.");
        return;
    }

    try {
        const res = await fetch(`${apiURL}/setJornada`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, numero, partidos })
        });
        const data = await res.json();
        alert(data.message);
        if (res.ok) cargarJornadaActual();
    } catch {
        alert("Error al guardar la jornada.");
    }
}

async function guardarResultados() {
    const password = document.getElementById('admin-password').value;
    if (!password) { alert("Ingresa la contraseña."); return; }

    const numeroEl = document.getElementById('resultados-jornada-num');
    if (!numeroEl) { alert("Carga primero la jornada."); return; }
    const numero = parseInt(numeroEl.value);

    const selects = document.querySelectorAll('.resultado-select');
    const resultados = Array.from(selects).map(s => s.value);

    try {
        const res = await fetch(`${apiURL}/setResultados`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, numero, resultados })
        });
        const data = await res.json();
        alert(data.message);
    } catch {
        alert("Error al guardar los resultados.");
    }
}

async function cargarJornadaActual() {
    const info = document.getElementById('jornada-actual-info');
    const contenedorResultados = document.getElementById('resultados-admin');

    try {
        const res = await fetch(`${apiURL}/getJornada`);
        const data = await res.json();

        if (!data.jornada) {
            _jornadaActualNum = null;
            info.textContent = 'No hay jornada configurada.';
            contenedorResultados.innerHTML = '';
            return;
        }

        const { numero, partidos } = data.jornada;
        _jornadaActualNum = numero;
        info.textContent = `Jornada ${numero} — ${partidos.length} partidos`;

        // Campo oculto con el número de jornada para guardar resultados
        contenedorResultados.innerHTML = `<input type="hidden" id="resultados-jornada-num" value="${numero}">`;

        partidos.forEach((p, i) => {
            const row = document.createElement('div');
            row.className = 'resultado-admin-row';
            row.innerHTML = `
                <img src="./img/${p.localImg}" alt="${p.local}" class="team-mini" title="${p.local}">
                <span class="partido-vs">${p.local} vs ${p.visita}</span>
                <img src="./img/${p.visitaImg}" alt="${p.visita}" class="team-mini" title="${p.visita}">
                <select class="resultado-select" data-index="${i}">
                    <option value=""   ${!p.resultado ? 'selected' : ''}>Sin resultado</option>
                    <option value="local"  ${p.resultado === 'local'  ? 'selected' : ''}>Local — ${p.local}</option>
                    <option value="empate" ${p.resultado === 'empate' ? 'selected' : ''}>Empate</option>
                    <option value="visita" ${p.resultado === 'visita' ? 'selected' : ''}>Visita — ${p.visita}</option>
                </select>`;
            contenedorResultados.appendChild(row);
        });

        // Pre-cargar el formulario de configurar jornada con los datos actuales
        document.getElementById('jornada-numero').value = numero;
        const contenedorPartidos = document.getElementById('partidos-admin');
        contenedorPartidos.innerHTML = '';
        partidos.forEach(p => agregarPartido(p.localImg, p.visitaImg, p.fecha, p.hora));

    } catch {
        info.textContent = 'Error al cargar la jornada.';
    }
}

async function cargarQuinielasAdmin() {
    const lista = document.getElementById('quinielas-admin-list');

    if (!_jornadaActualNum) {
        lista.innerHTML = '<p class="aviso">No hay jornada activa. Las jornadas archivadas aparecen en el historial de Resultados.</p>';
        return;
    }

    lista.innerHTML = '<p class="aviso"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</p>';

    try {
        const res = await fetch(`${apiURL}/getQuiniela?jornada=${_jornadaActualNum}`);
        const data = await res.json();
        const quinielas = data.quinielas;

        if (!quinielas || quinielas.length === 0) {
            lista.innerHTML = '<p class="aviso">No hay quinielas registradas.</p>';
            return;
        }

        const BADGE = { local: 'L', empate: 'E', visita: 'V' };
        const BADGE_CLS = { local: 'pred-local', empate: 'pred-empate', visita: 'pred-visita' };

        lista.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'quinielas-admin-grid';

        quinielas.forEach(q => {
            const card = document.createElement('div');
            card.className = 'quiniela-admin-card';
            card.dataset.id = q._id;

            const predRows = q.partidos.map(p => `
                <div class="quiniela-pred-row">
                    <span class="pred-equipo">${p.local}</span>
                    <span class="pred-badge ${BADGE_CLS[p.resultado] || ''}">${BADGE[p.resultado] || '?'}</span>
                    <span class="pred-equipo pred-right">${p.visita}</span>
                </div>`).join('');

            card.innerHTML = `
                <div class="quiniela-admin-header">
                    <span class="quiniela-admin-nombre">${q.nombre}</span>
                    <span class="quiniela-admin-jornada-badge">J${q.jornada ?? '—'}</span>
                </div>
                <div class="quiniela-admin-partidos">${predRows}</div>
                <button class="btn-eliminar-quiniela" onclick="eliminarQuinielaAdmin('${q._id}', '${q.nombre.replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-trash"></i> Eliminar
                </button>`;
            grid.appendChild(card);
        });

        lista.appendChild(grid);
    } catch {
        lista.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar las quinielas.</p>';
    }
}

async function eliminarQuinielaAdmin(id, nombre) {
    if (!confirm(`¿Eliminar la quiniela de "${nombre}"?`)) return;

    try {
        const res = await fetch(`${apiURL}/deleteQuiniela/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok) {
            const card = document.querySelector(`.quiniela-admin-card[data-id="${id}"]`);
            if (card) card.remove();
            const lista = document.getElementById('quinielas-admin-list');
            if (!lista.querySelector('.quiniela-admin-card')) {
                lista.innerHTML = '<p class="aviso">No hay quinielas registradas.</p>';
            }
        } else {
            alert(data.message || "Error al eliminar.");
        }
    } catch {
        alert("Error al eliminar la quiniela.");
    }
}

async function borrarTodasQuinielas() {
    const password = document.getElementById('admin-password').value;

    if (!confirm('¿Estás seguro de que deseas eliminar TODAS las quinielas?\n\nEsta acción no se puede deshacer.')) return;
    if (!confirm('Confirma de nuevo: ¿eliminar TODAS las quinielas permanentemente?')) return;

    try {
        const res = await fetch(`${apiURL}/deleteAllQuinielas`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, jornada: _jornadaActualNum })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.message);
            cargarQuinielasAdmin();
        } else {
            alert(data.message || "Error al eliminar las quinielas.");
        }
    } catch {
        alert("Error al conectar con el servidor.");
    }
}

async function verificarAdmin() {
    const password = document.getElementById('admin-password').value;
    const errorEl  = document.getElementById('password-error');
    const btn      = document.querySelector('.password-row .btn-primary');

    if (!password) {
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Ingresa la contraseña.';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const res = await fetch(`${apiURL}/verifyAdmin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            errorEl.style.display = 'none';
            document.getElementById('card-jornada').style.display   = 'block';
            document.getElementById('card-resultados').style.display = 'block';
            document.getElementById('card-eliminar').style.display   = 'block';
            document.getElementById('admin-password').disabled = true;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Verificado';
            btn.style.background = 'var(--green)';
            for (let i = 0; i < 9; i++) agregarPartido();
            cargarJornadaActual();
            cargarQuinielasAdmin();
        } else {
            errorEl.style.display = 'block';
            errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Contraseña incorrecta.';
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Continuar';
            document.getElementById('admin-password').focus();
        }
    } catch {
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error al conectar con el servidor.';
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Continuar';
    }
}
