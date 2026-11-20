// ── Borrador en localStorage ──────────────────────────────────────────────────
// Guarda nombre y selecciones para que no se pierdan si se recarga la página.

function claveBorrador() {
    const num = document.getElementById('partidos-form')?.dataset.jornada;
    return num ? `borradorQuiniela:${num}` : null;
}

function guardarBorrador() {
    const clave = claveBorrador();
    if (!clave) return;
    const borrador = {
        nombre: document.getElementById('nombre')?.value || '',
        resultados: Array.from(document.querySelectorAll('#partidos-form .partido')).map(p => ({
            local:     p.dataset.local,
            visita:    p.dataset.visita,
            resultado: p.querySelector('.resultado-oculto').value
        }))
    };
    try { localStorage.setItem(clave, JSON.stringify(borrador)); } catch { /* sin almacenamiento */ }
}

function borrarBorrador() {
    const clave = claveBorrador();
    try { if (clave) localStorage.removeItem(clave); } catch { /* sin almacenamiento */ }
}

function restaurarBorrador() {
    const clave = claveBorrador();
    let borrador = null;
    try { borrador = JSON.parse(localStorage.getItem(clave) || 'null'); } catch { /* ignorar */ }
    if (!borrador) return;

    const inputNombre = document.getElementById('nombre');
    if (inputNombre && borrador.nombre) inputNombre.value = borrador.nombre;

    let restaurados = 0;
    document.querySelectorAll('#partidos-form .partido').forEach((partido, i) => {
        const guardado = borrador.resultados?.[i];
        // Solo si el partido en esa posición sigue siendo el mismo.
        if (!guardado?.resultado || guardado.local !== partido.dataset.local || guardado.visita !== partido.dataset.visita) return;
        seleccionar(partido, guardado.resultado, false);
        restaurados++;
    });

    if (restaurados > 0) toast('Recuperamos tu quiniela sin enviar.', 'info');
}

// ── Selección de resultados ───────────────────────────────────────────────────

function updateProgreso() {
    const inputs   = document.querySelectorAll('#partidos-form .resultado-oculto');
    const total    = inputs.length;
    const elegidos = Array.from(inputs).filter(i => i.value !== '').length;

    const countEl = document.getElementById('progreso-count');
    const fillEl  = document.getElementById('progreso-fill');
    const wrapEl  = document.getElementById('progreso-wrap');
    const btnEl   = document.getElementById('btn-enviar');

    if (!countEl || !fillEl) return;

    countEl.textContent = elegidos;
    fillEl.style.width  = total > 0 ? `${(elegidos / total) * 100}%` : '0%';

    const completo = elegidos === total && total > 0;
    wrapEl?.classList.toggle('progreso-completo', completo);
    btnEl?.classList.toggle('btn-ready', completo);
}

function seleccionar(partido, resultado, guardar = true) {
    ['local', 'empate', 'visita'].forEach(opcion => {
        partido.querySelector(`.${opcion}`)?.classList.toggle('seleccionado', opcion === resultado);
    });
    partido.querySelector('.resultado-oculto').value = resultado;
    updateProgreso();
    if (guardar) guardarBorrador();
}

function initPartidoListeners() {
    document.querySelectorAll('#partidos-form .partido').forEach(partido => {
        ['local', 'empate', 'visita'].forEach(opcion => {
            const el = partido.querySelector(`.${opcion}`);
            if (!el) return;
            el.addEventListener('click', () => seleccionar(partido, opcion));
            el.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    seleccionar(partido, opcion);
                }
            });
        });
    });

    document.getElementById('nombre')?.addEventListener('input', guardarBorrador);
}
