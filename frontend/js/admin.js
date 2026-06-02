const apiURL = 'https://quinielamx.onrender.com';

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
            info.textContent = 'No hay jornada configurada.';
            contenedorResultados.innerHTML = '';
            return;
        }

        const { numero, partidos } = data.jornada;
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
            document.getElementById('admin-password').disabled = true;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Verificado';
            btn.style.background = 'var(--green)';
            for (let i = 0; i < 9; i++) agregarPartido();
            cargarJornadaActual();
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
