// ── Utilidades compartidas por todas las páginas ──────────────────────────────

// Escapa texto antes de insertarlo con innerHTML. Úsalo con TODO dato que venga del servidor.
function escapeHTML(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatFecha(fecha) {
    if (!fecha || !fecha.includes('-')) return fecha;
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}

function formatHora(hora) {
    if (!hora) return hora;
    const [h, m] = hora.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

function letraResultado(r) {
    return r === 'local' ? 'L' : r === 'empate' ? 'E' : r === 'visita' ? 'V' : '—';
}

// ── Toasts ────────────────────────────────────────────────────────────────────
const TOAST_ICONOS = {
    exito: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info:  'fa-circle-info'
};

function toast(mensaje, tipo = 'info', duracion = 3500) {
    let cont = document.getElementById('toast-container');
    if (!cont) {
        cont = document.createElement('div');
        cont.id = 'toast-container';
        cont.className = 'toast-container';
        cont.setAttribute('aria-live', 'polite');
        document.body.appendChild(cont);
    }
    const el = document.createElement('div');
    el.className = `toast toast--${tipo}`;
    el.innerHTML = `<i class="fa-solid ${TOAST_ICONOS[tipo] || TOAST_ICONOS.info}"></i><span></span>`;
    el.querySelector('span').textContent = mensaje;
    cont.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
        el.classList.remove('visible');
        setTimeout(() => el.remove(), 250);
    }, duracion);
}

// ── Modal de confirmación (reemplaza confirm) ────────────────────────────────
// Uso: if (!(await confirmar('¿Seguro?'))) return;
function confirmar(mensaje, { titulo = 'Confirmar', aceptar = 'Aceptar', cancelar = 'Cancelar', peligro = false } = {}) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
                <h3 id="modal-titulo"></h3>
                <p class="modal-mensaje"></p>
                <div class="modal-botones">
                    <button type="button" class="modal-btn modal-btn--cancelar"></button>
                    <button type="button" class="modal-btn ${peligro ? 'modal-btn--peligro' : 'modal-btn--aceptar'}"></button>
                </div>
            </div>`;
        overlay.querySelector('h3').textContent = titulo;
        overlay.querySelector('.modal-mensaje').textContent = mensaje;
        const [btnNo, btnSi] = overlay.querySelectorAll('.modal-btn');
        btnNo.textContent = cancelar;
        btnSi.textContent = aceptar;

        const cerrar = valor => {
            document.removeEventListener('keydown', onKey);
            overlay.remove();
            resolve(valor);
        };
        const onKey = e => {
            if (e.key === 'Escape') cerrar(false);
            if (e.key === 'Enter')  cerrar(true);
        };

        btnNo.addEventListener('click', () => cerrar(false));
        btnSi.addEventListener('click', () => cerrar(true));
        overlay.addEventListener('click', e => { if (e.target === overlay) cerrar(false); });
        document.addEventListener('keydown', onKey);

        document.body.appendChild(overlay);
        btnSi.focus();
    });
}
