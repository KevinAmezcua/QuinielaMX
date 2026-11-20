const apiURL = 'https://quinielamx.onrender.com';

// Si una petición tarda más de esto, probablemente Render está "despertando".
const AVISO_ARRANQUE_MS = 3000;
let _peticionesLentas = 0;

async function fetchWithRetry(url, options = {}) {
    const timer = setTimeout(() => {
        _peticionesLentas++;
        mostrarAvisoArranque(true);
    }, AVISO_ARRANQUE_MS);

    try {
        for (let attempt = 1; attempt <= 3; attempt++) {
            const res = await fetch(url, options);
            if (res.status !== 429 || attempt === 3) return res;
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    } finally {
        clearTimeout(timer);
        if (_peticionesLentas > 0 && --_peticionesLentas === 0) mostrarAvisoArranque(false);
    }
}

function mostrarAvisoArranque(visible) {
    let el = document.getElementById('aviso-arranque');
    if (!el && visible) {
        el = document.createElement('div');
        el.id = 'aviso-arranque';
        el.className = 'aviso-arranque';
        el.setAttribute('role', 'status');
        el.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Conectando con el servidor… puede tardar hasta 30 segundos la primera vez.';
        document.body.appendChild(el);
    }
    if (el) el.classList.toggle('visible', visible);
}
