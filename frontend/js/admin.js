let _jornadaActualNum = null;

function adminHeaders() {
    const token = sessionStorage.getItem('adminToken');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// Petición autenticada. Si la sesión expiró, avisa y vuelve a pedir contraseña.
async function apiAdmin(ruta, opciones = {}) {
    const res = await fetchWithRetry(`${apiURL}${ruta}`, { ...opciones, headers: adminHeaders() });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
        sessionStorage.removeItem('adminToken');
        toast(data.message || 'Sesión expirada. Vuelve a iniciar sesión.', 'error', 5000);
        setTimeout(() => window.location.reload(), 1500);
    }
    return { res, data };
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

// ── Configurar jornada ────────────────────────────────────────────────────────

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
            `<option value="${escapeHTML(e.img)}" data-nombre="${escapeHTML(e.nombre)}" ${selected === e.img ? 'selected' : ''}>${escapeHTML(e.nombre)}</option>`
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
            <select class="local-select">
                <option value="">-- Equipo --</option>
                ${equipoOptions(localImg)}
            </select>
            <img class="team-preview" alt="">
        </div>
        <div class="partido-admin-centro">
            <input type="date" class="partido-fecha">
            <input type="time" class="partido-hora">
        </div>
        <div class="partido-admin-equipo">
            <label>Visita</label>
            <select class="visita-select">
                <option value="">-- Equipo --</option>
                ${equipoOptions(visitaImg)}
            </select>
            <img class="team-preview" alt="">
        </div>
        <button class="btn-remove" type="button" aria-label="Quitar partido">
            <i class="fa-solid fa-trash"></i>
        </button>`;

    div.querySelector('.partido-fecha').value = fecha;
    div.querySelector('.partido-hora').value  = hora;

    div.querySelectorAll('select').forEach(sel => {
        const img = sel.parentElement.querySelector('.team-preview');
        sel.addEventListener('change', () => previewTeam(sel, img));
        previewTeam(sel, img, false);
    });

    div.querySelector('.btn-remove').addEventListener('click', () => {
        div.remove();
        renumerarPartidos();
        actualizarOpcionesDisponibles();
    });

    contenedor.appendChild(div);
    actualizarOpcionesDisponibles();
}

async function limpiarPartidos() {
    if (!(await confirmar('¿Limpiar todos los partidos del formulario?', { aceptar: 'Limpiar' }))) return;
    document.getElementById('partidos-admin').innerHTML = '';
}

function renumerarPartidos() {
    document.querySelectorAll('.partido-num').forEach((el, i) => {
        el.textContent = i + 1;
    });
}

function previewTeam(select, img, actualizar = true) {
    if (!img) return;
    const opt = select.options[select.selectedIndex];
    if (select.value) {
        img.src = `./img/${select.value}`;
        img.alt = opt?.dataset.nombre || '';
        img.style.visibility = 'visible';
    } else {
        img.removeAttribute('src');
        img.style.visibility = 'hidden';
    }
    if (actualizar) actualizarOpcionesDisponibles();
}

async function guardarJornada() {
    const numero = parseInt(document.getElementById('jornada-numero').value);
    if (!numero) { toast('Ingresa el número de jornada.', 'error'); return; }

    const partidos = [];
    for (const fila of document.querySelectorAll('.partido-admin')) {
        const localSel  = fila.querySelector('.local-select');
        const visitaSel = fila.querySelector('.visita-select');
        const fecha     = fila.querySelector('.partido-fecha').value;
        const hora      = fila.querySelector('.partido-hora').value;
        const localImg  = localSel.value;
        const visitaImg = visitaSel.value;
        const local     = localSel.options[localSel.selectedIndex]?.dataset.nombre || '';
        const visita    = visitaSel.options[visitaSel.selectedIndex]?.dataset.nombre || '';

        if (!localImg || !visitaImg || !fecha || !hora) {
            toast('Completa todos los campos de cada partido (equipos, fecha y hora).', 'error');
            return;
        }
        partidos.push({ local, localImg, visita, visitaImg, fecha, hora });
    }

    if (partidos.length === 0) { toast('Agrega al menos un partido.', 'error'); return; }

    try {
        const { res, data } = await apiAdmin('/setJornada', {
            method: 'PUT',
            body: JSON.stringify({ numero, partidos })
        });
        toast(data.message || 'Error al guardar la jornada.', res.ok ? 'exito' : 'error');
        if (res.ok) cargarJornadaActual();
    } catch {
        toast('Error al guardar la jornada.', 'error');
    }
}

async function archivarJornada() {
    const numero = _jornadaActualNum;
    if (!numero) { toast('No hay jornada activa para archivar.', 'error'); return; }

    const ok = await confirmar(
        `Los partidos y quinielas de la Jornada ${numero} quedarán guardados en el historial, pero ya no será la jornada activa.`,
        { titulo: `¿Archivar la Jornada ${numero}?`, aceptar: 'Archivar' }
    );
    if (!ok) return;

    try {
        const { res, data } = await apiAdmin('/archivarJornada', {
            method: 'PUT',
            body: JSON.stringify({ numero })
        });
        if (res.ok) {
            toast(data.message, 'exito');
            _jornadaActualNum = null;
            document.getElementById('partidos-admin').innerHTML = '';
            document.getElementById('jornada-numero').value = '';
            document.getElementById('resultados-admin').innerHTML = '';
            document.getElementById('jornada-actual-info').textContent = 'No hay jornada activa.';
            document.getElementById('envios-banner').style.display = 'none';
            cargarQuinielasAdmin();
            cargarParticipantes();
        } else {
            toast(data.message || 'Error al archivar la jornada.', 'error');
        }
    } catch {
        toast('Error al conectar con el servidor.', 'error');
    }
}

// ── Envíos ────────────────────────────────────────────────────────────────────

function formatCierre(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-MX', {
        weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
    });
}

function actualizarBannerEnvios({ enviosAbiertos, aceptaEnvios, cierreEnvios }) {
    const banner = document.getElementById('envios-banner');
    const icon   = document.getElementById('envios-icon');
    const titulo = document.getElementById('envios-titulo');
    const desc   = document.getElementById('envios-desc');
    const btn    = document.getElementById('btn-toggle-envios');
    if (!banner) return;

    banner.style.display = 'flex';
    const cierre = formatCierre(cierreEnvios);

    if (aceptaEnvios) {
        banner.className   = 'envios-banner envios-banner--abierto';
        icon.className     = 'fa-solid fa-paper-plane envios-banner-icon';
        titulo.textContent = 'Envíos abiertos';
        desc.textContent   = cierre
            ? `Se cerrarán automáticamente al iniciar el primer partido (${cierre}).`
            : 'Los participantes pueden enviar su quiniela.';
    } else {
        banner.className   = 'envios-banner envios-banner--cerrado';
        icon.className     = 'fa-solid fa-lock envios-banner-icon';
        titulo.textContent = 'Envíos cerrados';
        desc.textContent   = enviosAbiertos
            ? `Se cerraron automáticamente porque ya inició el primer partido (${cierre}).`
            : 'Los cerraste manualmente. Los participantes no pueden enviar quinielas.';
    }

    if (enviosAbiertos) {
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> Cerrar Envíos';
        btn.className = 'btn-toggle-envios btn-cerrar-envios';
        btn.disabled  = !aceptaEnvios;
        btn.title     = aceptaEnvios ? '' : 'El cierre automático ya ocurrió; cambia la fecha del primer partido para reabrir.';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Abrir Envíos';
        btn.className = 'btn-toggle-envios btn-abrir-envios';
        btn.disabled  = false;
        btn.title     = '';
    }
}

async function toggleEnvios() {
    const numero = _jornadaActualNum;
    if (!numero) { toast('No hay jornada activa.', 'error'); return; }

    try {
        const { res, data } = await apiAdmin('/toggleEnvios', {
            method: 'PUT',
            body: JSON.stringify({ numero })
        });
        if (res.ok) {
            actualizarBannerEnvios(data);
            toast(data.message, 'exito');
        } else {
            toast(data.message || 'Error al cambiar el estado de envíos.', 'error');
        }
    } catch {
        toast('Error al conectar con el servidor.', 'error');
    }
}

// ── Resultados ────────────────────────────────────────────────────────────────

async function guardarResultados() {
    if (!_jornadaActualNum) { toast('Carga primero la jornada.', 'error'); return; }

    const resultados = Array.from(document.querySelectorAll('.resultado-select')).map(s => s.value);

    try {
        const { res, data } = await apiAdmin('/setResultados', {
            method: 'PUT',
            body: JSON.stringify({ numero: _jornadaActualNum, resultados })
        });
        toast(data.message || 'Error al guardar los resultados.', res.ok ? 'exito' : 'error');
    } catch {
        toast('Error al guardar los resultados.', 'error');
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

        const { numero, partidos } = data.jornada;
        _jornadaActualNum = numero;
        info.textContent = `Jornada ${numero} — ${partidos.length} partidos`;
        actualizarBannerEnvios(data.jornada);

        contenedorResultados.innerHTML = partidos.map((p, i) => {
            const local  = escapeHTML(p.local);
            const visita = escapeHTML(p.visita);
            return `
                <div class="resultado-admin-row">
                    <img src="./img/${escapeHTML(p.localImg)}" alt="${local}" class="team-mini" title="${local}">
                    <span class="partido-vs">${local} vs ${visita}</span>
                    <img src="./img/${escapeHTML(p.visitaImg)}" alt="${visita}" class="team-mini" title="${visita}">
                    <select class="resultado-select" data-index="${i}">
                        <option value=""       ${!p.resultado ? 'selected' : ''}>Sin resultado</option>
                        <option value="local"  ${p.resultado === 'local'  ? 'selected' : ''}>Local — ${local}</option>
                        <option value="empate" ${p.resultado === 'empate' ? 'selected' : ''}>Empate</option>
                        <option value="visita" ${p.resultado === 'visita' ? 'selected' : ''}>Visita — ${visita}</option>
                    </select>
                </div>`;
        }).join('');

        // Pre-cargar el formulario de configurar jornada con los datos actuales
        document.getElementById('jornada-numero').value = numero;
        document.getElementById('partidos-admin').innerHTML = '';
        partidos.forEach(p => agregarPartido(p.localImg, p.visitaImg, p.fecha, p.hora));
        actualizarOpcionesDisponibles();

    } catch {
        info.textContent = 'Error al cargar la jornada.';
    }
}

// ── Eliminar quinielas ────────────────────────────────────────────────────────

async function cargarQuinielasAdmin() {
    const lista = document.getElementById('quinielas-admin-list');

    if (!_jornadaActualNum) {
        lista.innerHTML = '<p class="aviso">No hay jornada activa. Las jornadas archivadas aparecen en el historial de Resultados.</p>';
        return;
    }

    lista.innerHTML = '<p class="aviso"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</p>';

    try {
        const { res, data } = await apiAdmin(`/admin/quinielas?jornada=${_jornadaActualNum}`);
        if (!res.ok) throw new Error(data.message);
        const quinielas = data.quinielas;

        if (!quinielas || quinielas.length === 0) {
            lista.innerHTML = '<p class="aviso">No hay quinielas registradas.</p>';
            return;
        }

        const BADGE_CLS = { local: 'pred-local', empate: 'pred-empate', visita: 'pred-visita' };

        const grid = document.createElement('div');
        grid.className = 'quinielas-admin-grid';

        quinielas.forEach(q => {
            const card = document.createElement('div');
            card.className = 'quiniela-admin-card';
            card.dataset.id = q._id;

            const predRows = q.partidos.map(p => `
                <div class="quiniela-pred-row">
                    <span class="pred-equipo">${escapeHTML(p.local)}</span>
                    <span class="pred-badge ${BADGE_CLS[p.resultado] || ''}">${letraResultado(p.resultado)}</span>
                    <span class="pred-equipo pred-right">${escapeHTML(p.visita)}</span>
                </div>`).join('');

            card.innerHTML = `
                <div class="quiniela-admin-header">
                    <span class="quiniela-admin-nombre">${escapeHTML(q.nombre)}</span>
                    <span class="quiniela-admin-jornada-badge">J${escapeHTML(q.jornada ?? '—')}</span>
                </div>
                <div class="quiniela-admin-partidos">${predRows}</div>
                <button class="btn-eliminar-quiniela" type="button">
                    <i class="fa-solid fa-trash"></i> Eliminar
                </button>`;
            card.querySelector('.btn-eliminar-quiniela')
                .addEventListener('click', () => eliminarQuinielaAdmin(q._id, q.nombre));
            grid.appendChild(card);
        });

        lista.innerHTML = '';
        lista.appendChild(grid);
    } catch {
        lista.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar las quinielas.</p>';
    }
}

async function eliminarQuinielaAdmin(id, nombre) {
    const ok = await confirmar(`Se eliminará la quiniela de "${nombre}". Esta acción no se puede deshacer.`,
        { titulo: '¿Eliminar quiniela?', aceptar: 'Eliminar', peligro: true });
    if (!ok) return;

    try {
        const { res, data } = await apiAdmin(`/deleteQuiniela/${encodeURIComponent(id)}`, { method: 'DELETE' });

        if (res.ok) {
            document.querySelector(`.quiniela-admin-card[data-id="${CSS.escape(id)}"]`)?.remove();
            const lista = document.getElementById('quinielas-admin-list');
            if (!lista.querySelector('.quiniela-admin-card')) {
                lista.innerHTML = '<p class="aviso">No hay quinielas registradas.</p>';
            }
            toast('Quiniela eliminada.', 'exito');
            cargarParticipantes();
        } else {
            toast(data.message || 'Error al eliminar.', 'error');
        }
    } catch {
        toast('Error al eliminar la quiniela.', 'error');
    }
}

// ── Historial ─────────────────────────────────────────────────────────────────

async function limpiarHistorial() {
    const ok1 = await confirmar('Se borrarán permanentemente todas las jornadas archivadas y sus quinielas.',
        { titulo: '¿Eliminar todo el historial?', aceptar: 'Continuar', peligro: true });
    if (!ok1) return;
    const ok2 = await confirmar('Esta acción no se puede deshacer.',
        { titulo: 'Confirma de nuevo', aceptar: 'Eliminar historial', peligro: true });
    if (!ok2) return;

    try {
        const { res, data } = await apiAdmin('/deleteHistorial', { method: 'DELETE' });
        toast(data.message || 'Error al limpiar el historial.', res.ok ? 'exito' : 'error', 5000);
    } catch {
        toast('Error al conectar con el servidor.', 'error');
    }
}

// ── Participantes y pagos ─────────────────────────────────────────────────────

async function actualizarPago(id, estado, selectEl) {
    selectEl.disabled = true;
    try {
        const { res } = await apiAdmin(`/updatePago/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ estadoPago: estado })
        });
        if (res.ok) {
            selectEl.className = `pago-estado-select pago-estado--${estado}`;
            actualizarResumenPagos();
        } else {
            toast('Error al actualizar el estado de pago.', 'error');
            selectEl.value = estado === 'pagado' ? 'pendiente' : 'pagado';
        }
    } catch {
        toast('Error al conectar con el servidor.', 'error');
        selectEl.value = estado === 'pagado' ? 'pendiente' : 'pagado';
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
        const { res, data } = await apiAdmin(`/admin/quinielas?jornada=${_jornadaActualNum}`);
        if (!res.ok) throw new Error(data.message);
        const quinielas = data.quinielas;

        if (!quinielas || quinielas.length === 0) {
            lista.innerHTML = '<p class="aviso">No hay participantes registrados en esta jornada.</p>';
            return;
        }

        lista.innerHTML = `
            <div class="participantes-top-bar">
                <p class="participantes-counter">
                    <i class="fa-solid fa-users"></i>
                    ${quinielas.length} participante${quinielas.length !== 1 ? 's' : ''} — Jornada ${_jornadaActualNum}
                </p>
                <div class="participantes-resumen" id="participantes-resumen"></div>
            </div>`;

        const tabla = document.createElement('div');
        tabla.className = 'participantes-tabla';
        tabla.innerHTML = `
            <div class="participante-row participante-row--header">
                <span>#</span>
                <span>Nombre</span>
                <span>Celular</span>
                <span>Pago</span>
            </div>`;

        quinielas.forEach((q, i) => {
            const row = document.createElement('div');
            row.className = 'participante-row';
            const celularHTML = q.celular
                ? `<span class="celular-texto"><i class="fa-solid fa-phone"></i> ${escapeHTML(q.celular)}</span>`
                : `<span class="sin-celular">—</span>`;
            const estado = q.estadoPago === 'pagado' ? 'pagado' : 'pendiente';
            row.innerHTML = `
                <span class="participante-num">${i + 1}</span>
                <span class="participante-nombre">${escapeHTML(q.nombre || '—')}</span>
                <span class="participante-celular">${celularHTML}</span>
                <span class="participante-pago">
                    <span class="pago-select-wrap">
                        <select class="pago-estado-select pago-estado--${estado}">
                            <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="pagado"    ${estado === 'pagado'    ? 'selected' : ''}>Pagado</option>
                        </select>
                        <i class="fa-solid fa-chevron-down pago-select-icono"></i>
                    </span>
                </span>`;
            const select = row.querySelector('select');
            select.addEventListener('change', () => actualizarPago(q._id, select.value, select));
            tabla.appendChild(row);
        });

        lista.appendChild(tabla);
        actualizarResumenPagos();
    } catch {
        lista.innerHTML = '<p class="aviso" style="color:#f87171">Error al cargar los participantes.</p>';
    }
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function iniciarPanel() {
    document.getElementById('admin-password').disabled = true;
    const btn = document.querySelector('.password-row .btn-primary');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Verificado';
    btn.style.background = 'var(--green)';
    document.getElementById('admin-tab-bar').style.display = 'flex';
    switchTab('jornada');
    for (let i = 0; i < 9; i++) agregarPartido();
    await cargarJornadaActual();
    cargarQuinielasAdmin();
    cargarParticipantes();
}

async function verificarAdmin() {
    const password = document.getElementById('admin-password').value;
    const errorEl  = document.getElementById('password-error');
    const btn      = document.querySelector('.password-row .btn-primary');

    const mostrarError = msg => {
        errorEl.style.display = 'block';
        errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ';
        errorEl.append(msg);
    };

    if (!password) { mostrarError('Ingresa la contraseña.'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const res = await fetchWithRetry(`${apiURL}/verifyAdmin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            sessionStorage.setItem('adminToken', data.token);
            errorEl.style.display = 'none';
            await iniciarPanel();
        } else {
            mostrarError(data.message || 'Contraseña incorrecta.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Continuar';
            document.getElementById('admin-password').focus();
        }
    } catch {
        mostrarError('Error al conectar con el servidor.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Continuar';
    }
}
