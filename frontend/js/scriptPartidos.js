function updateProgreso() {
    const inputs  = document.querySelectorAll('#partidos-form .resultado-oculto');
    const total   = inputs.length;
    const elegidos = Array.from(inputs).filter(i => i.value !== '').length;

    const countEl  = document.getElementById('progreso-count');
    const fillEl   = document.getElementById('progreso-fill');
    const wrapEl   = document.getElementById('progreso-wrap');
    const btnEl    = document.getElementById('btn-enviar');

    if (!countEl || !fillEl) return;

    countEl.textContent = elegidos;
    fillEl.style.width  = total > 0 ? `${(elegidos / total) * 100}%` : '0%';

    if (elegidos === total && total > 0) {
        wrapEl?.classList.add('progreso-completo');
        btnEl?.classList.add('btn-ready');
    } else {
        wrapEl?.classList.remove('progreso-completo');
        btnEl?.classList.remove('btn-ready');
    }
}

function initPartidoListeners() {
    const partidos = document.querySelectorAll('#partidos-form .partido');

    partidos.forEach(partido => {
        const local      = partido.querySelector('.local');
        const empate     = partido.querySelector('.empate');
        const visita     = partido.querySelector('.visita');
        const inputHidden = partido.querySelector('.resultado-oculto');

        if (!local || !empate || !visita || !inputHidden) return;

        function limpiar() {
            local.classList.remove('seleccionado');
            empate.classList.remove('seleccionado');
            visita.classList.remove('seleccionado');
        }

        local.addEventListener('click', () => {
            limpiar();
            local.classList.add('seleccionado');
            inputHidden.value = 'local';
            updateProgreso();
        });

        empate.addEventListener('click', () => {
            limpiar();
            empate.classList.add('seleccionado');
            inputHidden.value = 'empate';
            updateProgreso();
        });

        visita.addEventListener('click', () => {
            limpiar();
            visita.classList.add('seleccionado');
            inputHidden.value = 'visita';
            updateProgreso();
        });
    });
}
