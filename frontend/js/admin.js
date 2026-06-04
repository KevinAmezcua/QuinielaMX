let _jornadaActualNum = null;

function adminHeaders() {
    const token = sessionStorage.getItem('adminToken');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

function switchTab(name) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === name);
    });
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    const tabMap = {
        jornada:       'card-jornada',
        resultados:    'card-resultados',
        participantes: 'card-participantes',
        eliminar:      'card-eliminar',
        historial:     'card-historial'
    };
    const el = document.getElementById(tabMap[name]);
    if (el) el.style.display = 'block';
}

// ── MUNDIAL 2026 ── para regresar a Liga MX reemplaza este bloque con el comentado al final del archivo
const EQUIPOS = [
    { nombre: 'Alemania',        img: 'mundial/alemania.png' },
    { nombre: 'Arabia Saudita',  img: 'mundial/arabia.png' },
    { nombre: 'Argelia',         img: 'mundial/argelia.png' },
    { nombre: 'Argentina',       img: 'mundial/argentina.png' },
    { nombre: 'Australia',       img: 'mundial/australia.png' },
    { nombre: 'Austria',         img: 'mundial/austria.png' },
    { nombre: 'Bélgica',         img: 'mundial/belgica.png' },
    { nombre: 'Bosnia',          img: 'mundial/bosnia.png' },
    { nombre: 'Brasil',          img: 'mundial/brasil.png' },
    { nombre: 'Cabo Verde',      img: 'mundial/caboverde.png' },
    { nombre: 'Canadá',          img: 'mundial/canada.png' },
    { nombre: 'Catar',           img: 'mundial/catar.png' },
    { nombre: 'Chequia',         img: 'mundial/chequia.png' },
    { nombre: 'Colombia',        img: 'mundial/colombia.png' },
    { nombre: 'Congo',           img: 'mundial/congo.png' },
    { nombre: 'Corea del Sur',   img: 'mundial/coreadelsur.png' },
    { nombre: 'Costa de Marfil', img: 'mundial/costamarfil.png' },
    { nombre: 'Croacia',         img: 'mundial/croacia.png' },
    { nombre: 'Curazao',         img: 'mundial/curazao.png' },
    { nombre: 'Ecuador',         img: 'mundial/ecuador.png' },
    { nombre: 'Egipto',          img: 'mundial/egipto.png' },
    { nombre: 'Escocia',         img: 'mundial/escocia.png' },
    { nombre: 'España',          img: 'mundial/españa.png' },
    { nombre: 'Estados Unidos',  img: 'mundial/eua.png' },
    { nombre: 'Francia',         img: 'mundial/francia.png' },
    { nombre: 'Ghana',           img: 'mundial/ghana.png' },
    { nombre: 'Haití',           img: 'mundial/haiti.png' },
    { nombre: 'Holanda',         img: 'mundial/holanda.png' },
    { nombre: 'Inglaterra',      img: 'mundial/inglaterra.png' },
    { nombre: 'Irán',            img: 'mundial/iran.png' },
    { nombre: 'Irak',            img: 'mundial/irak.png' },
    { nombre: 'Japón',           img: 'mundial/japon.png' },
    { nombre: 'Jordania',        img: 'mundial/jordania.png' },
    { nombre: 'Marruecos',       img: 'mundial/marruecos.png' },
    { nombre: 'México',          img: 'mundial/mexico.png' },
    { nombre: 'Noruega',         img: 'mundial/noruega.png' },
    { nombre: 'Nueva Zelanda',   img: 'mundial/nuevazelanda.png' },
    { nombre: 'Panamá',          img: 'mundial/panama.png' },
    { nombre: 'Paraguay',        img: 'mundial/paraguay.png' },
    { nombre: 'Portugal',        img: 'mundial/portugal.png' },
    { nombre: 'Senegal',         img: 'mundial/senegal.png' },
    { nombre: 'Sudáfrica',       img: 'mundial/sudafrica.png' },
    { nombre: 'Suecia',          img: 'mundial/suecia.png' },
    { nombre: 'Suiza',           img: 'mundial/suiza.png' },
    { nombre: 'Túnez',           img: 'mundial/tunez.png' },
    { nombre: 'Turquía',         img: 'mundial/turquia.png' },
    { nombre: 'Uruguay',         img: 'mundial/uruguay.png' },
    { nombre: 'Uzbekistán',      img: 'mundial/uzbekistan.png' },
];

function getEquiposUsados() {
    const usados = new Set();
    document.querySelectorAll('.local-select, .visita-select').forEach(sel => {
        if (sel.value) usados.add(sel.value);
    });
    return usados;
}

function equipoOptions(selected = '', excluir = new Set()) {
    return EQUIPOS
        .filter(e => !excluir.has(e.img))
        .map(e =>
            `<option value="${e.img}" data-nombre="${e.nombre}" ${selected === e.img ? 'selected' : ''}>${e.nombre}</option>`
        ).join('');
}

function actualizarOpcionesDisponibles() {
    const usados = getEquiposUsados();
    document.querySelectorAll('.local-select, .visita-select').forEach(sel => {
        const seleccionado = sel.value;
        const excluir = new Set(usados);
        excluir.delete(seleccionado);
        sel.innerHTML = '<option value="">-- Equipo --</option>' + equipoOptions(seleccionado, excluir);
    });
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
        <button class="btn-remove" onclick="this.closest('.partido-admin').remove(); renumerarPartidos(); actualizarOpcionesDisponibles()">
            <i class="fa-solid fa-trash"></i>
        </button>`;
    contenedor.appendChild(div);
}

function limpiarPartidos() {
    if (!confirm('¿Limpiar todos los partidos del formulario?')) return;
    document.getElementById('partidos-admin').innerHTML = '';
}

async function archivarJornada() {
    const numero = _jornadaActualNum;

    if (!numero) { alert("No hay jornada activa para archivar."); return; }

    if (!confirm(`¿Archivar la Jornada ${numero}?\n\nLos partidos y quinielas quedarán guardados en el historial pero ya no serán la jornada activa.`)) return;

    try {
        const res = await fetchWithRetry(`${apiURL}/archivarJornada`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify({ numero })
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
    actualizarOpcionesDisponibles();
}

async function guardarJornada() {
    const numero = parseInt(document.getElementById('jornada-numero').value);

    if (!numero) { alert("Ingresa el número de jornada."); return; }

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
        const res = await fetchWithRetry(`${apiURL}/setJornada`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify({ numero, partidos })
        });
        const data = await res.json();
        alert(data.message);
        if (res.ok) cargarJornadaActual();
    } catch {
        alert("Error al guardar la jornada.");
    }
}

async function guardarResultados() {
    const numeroEl = document.getElementById('resultados-jornada-num');
    if (!numeroEl) { alert("Carga primero la jornada."); return; }
    const numero = parseInt(numeroEl.value);

    const selects = document.querySelectorAll('.resultado-select');
    const resultados = Array.from(selects).map(s => s.value);

    try {
        const res = await fetchWithRetry(`${apiURL}/setResultados`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify({ numero, resultados })
        });
        const data = await res.json();
        alert(data.message);
    } catch {
        alert("Error al guardar los resultados.");
    }
}

function actualizarBannerEnvios(abiertos) {
    const banner  = document.getElementById('envios-banner');
    const icon    = document.getElementById('envios-icon');
    const titulo  = document.getElementById('envios-titulo');
    const desc    = document.getElementById('envios-desc');
    const btn     = document.getElementById('btn-toggle-envios');
    if (!banner) return;

    banner.style.display = 'flex';

    if (abiertos) {
        banner.className = 'envios-banner envios-banner--abierto';
        icon.className   = 'fa-solid fa-paper-plane envios-banner-icon';
        titulo.textContent = 'Envíos abiertos';
        desc.textContent   = 'Los participantes pueden enviar su quiniela.';
        btn.innerHTML      = '<i class="fa-solid fa-lock"></i> Cerrar Envíos';
        btn.className      = 'btn-toggle-envios btn-cerrar-envios';
    } else {
        banner.className = 'envios-banner envios-banner--cerrado';
        icon.className   = 'fa-solid fa-lock envios-banner-icon';
        titulo.textContent = 'Envíos cerrados';
        desc.textContent   = 'Los participantes no pueden enviar quinielas.';
        btn.innerHTML      = '<i class="fa-solid fa-lock-open"></i> Abrir Envíos';
        btn.className      = 'btn-toggle-envios btn-abrir-envios';
    }
}

async function toggleEnvios() {
    const numero = _jornadaActualNum;
    if (!numero) { alert("No hay jornada activa."); return; }

    try {
        const res = await fetchWithRetry(`${apiURL}/toggleEnvios`, {
            method: 'PUT',
            headers: adminHeaders(),
            body: JSON.stringify({ numero })
        });
        const data = await res.json();
        if (res.ok) {
            actualizarBannerEnvios(data.enviosAbiertos);
        } else {
            alert(data.message || "Error al cambiar el estado de envíos.");
        }
    } catch {
        alert("Error al conectar con el servidor.");
    }
}

async function cargarJornadaActual() {
    const info = document.getElementById('jornada-actual-info');
    const contenedorResultados = document.getElementById('resultados-admin');

    try {
        const res = await fetchWithRetry(`${apiURL}/getJornada`);
        const data = await res.json();

        if (!data.jornada) {
            _jornadaActualNum = null;
            info.textContent = 'No hay jornada configurada.';
            contenedorResultados.innerHTML = '';
            const banner = document.getElementById('envios-banner');
            if (banner) banner.style.display = 'none';
            return;
        }

        const { numero, partidos, enviosAbiertos } = data.jornada;
        _jornadaActualNum = numero;
        info.textContent = `Jornada ${numero} — ${partidos.length} partidos`;
        actualizarBannerEnvios(enviosAbiertos !== false);

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
        actualizarOpcionesDisponibles();

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
        const res = await fetchWithRetry(`${apiURL}/getQuiniela?jornada=${_jornadaActualNum}`);
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
        const res = await fetchWithRetry(`${apiURL}/deleteQuiniela/${id}`, { method: 'DELETE', headers: adminHeaders() });
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


async function limpiarHistorial() {
    if (!confirm('¿Eliminar todo el historial?\n\nSe borrarán permanentemente todas las jornadas archivadas y sus quinielas.')) return;
    if (!confirm('Confirma de nuevo: ¿eliminar el historial completo? Esta acción no se puede deshacer.')) return;

    try {
        const res = await fetchWithRetry(`${apiURL}/deleteHistorial`, {
            method: 'DELETE',
            headers: adminHeaders()
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.message);
        } else {
            alert(data.message || "Error al limpiar el historial.");
        }
    } catch {
        alert("Error al conectar con el servidor.");
    }
}

async function actualizarPago(id, estado, selectEl) {
    selectEl.disabled = true;
    try {
        const res = await fetchWithRetry(`${apiURL}/updatePago/${id}`, {
            method: 'PATCH',
            headers: adminHeaders(),
            body: JSON.stringify({ estadoPago: estado })
        });
        if (res.ok) {
            selectEl.className = `pago-estado-select pago-estado--${estado}`;
            const icono = selectEl.nextElementSibling;
            if (icono) icono.style.color = '';
            actualizarResumenPagos();
        } else {
            alert("Error al actualizar el estado de pago.");
            selectEl.value = estado === 'pagado' ? 'pendiente' : 'pagado';
        }
    } catch {
        alert("Error al conectar con el servidor.");
    } finally {
        selectEl.disabled = false;
    }
}

function actualizarResumenPagos() {
    const selects = document.querySelectorAll('.pago-estado-select');
    const total   = selects.length;
    const pagados = Array.from(selects).filter(s => s.value === 'pagado').length;
    const resumen = document.getElementById('participantes-resumen');
    if (resumen) {
        resumen.innerHTML = `
            <span class="resumen-chip resumen-pagados"><i class="fa-solid fa-circle-check"></i> ${pagados} pagado${pagados !== 1 ? 's' : ''}</span>
            <span class="resumen-chip resumen-pendientes"><i class="fa-solid fa-clock"></i> ${total - pagados} pendiente${(total - pagados) !== 1 ? 's' : ''}</span>`;
    }
}

async function cargarParticipantes() {
    const lista = document.getElementById('participantes-admin-list');

    if (!_jornadaActualNum) {
        lista.innerHTML = '<p class="aviso">No hay jornada activa. Los participantes aparecen cuando hay una jornada configurada.</p>';
        return;
    }

    lista.innerHTML = '<p class="aviso"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</p>';

    try {
        const res = await fetchWithRetry(`${apiURL}/getQuiniela?jornada=${_jornadaActualNum}`);
        const data = await res.json();
        const quinielas = data.quinielas;

        if (!quinielas || quinielas.length === 0) {
            lista.innerHTML = '<p class="aviso">No hay participantes registrados en esta jornada.</p>';
            return;
        }

        lista.innerHTML = '';

        const topBar = document.createElement('div');
        topBar.className = 'participantes-top-bar';
        topBar.innerHTML = `
            <p class="participantes-counter">
                <i class="fa-solid fa-users"></i>
                ${quinielas.length} participante${quinielas.length !== 1 ? 's' : ''} — Jornada ${_jornadaActualNum}
            </p>
            <div class="participantes-resumen" id="participantes-resumen"></div>`;
        lista.appendChild(topBar);

        const tabla = document.createElement('div');
        tabla.className = 'participantes-tabla';

        const header = document.createElement('div');
        header.className = 'participante-row participante-row--header';
        header.innerHTML = `
            <span>#</span>
            <span>Nombre</span>
            <span>Celular</span>
            <span>Pago</span>`;
        tabla.appendChild(header);

        quinielas.forEach((q, i) => {
            const row = document.createElement('div');
            row.className = 'participante-row';
            const celularHTML = q.celular
                ? `<span class="celular-texto"><i class="fa-solid fa-phone"></i> ${q.celular}</span>`
                : `<span class="sin-celular">—</span>`;
            const estado = q.estadoPago || 'pendiente';
            row.innerHTML = `
                <span class="participante-num">${i + 1}</span>
                <span class="participante-nombre">${q.nombre || '—'}</span>
                <span class="participante-celular">${celularHTML}</span>
                <span class="participante-pago">
                    <span class="pago-select-wrap">
                        <select class="pago-estado-select pago-estado--${estado}"
                                onchange="actualizarPago('${q._id}', this.value, this)">
                            <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="pagado"    ${estado === 'pagado'    ? 'selected' : ''}>Pagado</option>
                        </select>
                        <i class="fa-solid fa-chevron-down pago-select-icono"></i>
                    </span>
                </span>`;
            tabla.appendChild(row);
        });

        lista.appendChild(tabla);
        actualizarResumenPagos();
    } catch {
        lista.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar los participantes.</p>';
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
        const res = await fetchWithRetry(`${apiURL}/verifyAdmin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem('adminToken', data.token);
            errorEl.style.display = 'none';
            document.getElementById('admin-password').disabled = true;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Verificado';
            btn.style.background = 'var(--green)';
            document.getElementById('admin-tab-bar').style.display = 'flex';
            switchTab('jornada');
            for (let i = 0; i < 9; i++) agregarPartido();
            await cargarJornadaActual();
            cargarQuinielasAdmin();
            cargarParticipantes();
        } else {
            const data = await res.json().catch(() => ({}));
            const msg = data.message || 'Contraseña incorrecta.';
            errorEl.style.display = 'block';
            errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
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
