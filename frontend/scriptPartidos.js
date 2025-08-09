const partidos = document.querySelectorAll('.partido');

partidos.forEach(partido => {
    const local = partido.querySelector('.local');
    const empate = partido.querySelector('.empate');
    const visita = partido.querySelector('.visita');
    const inputHidden = partido.querySelector('.resultado-oculto');

    // Si este .partido no es un partido real, saltar
    if (!local || !empate || !visita || !inputHidden) return;

    function limpiarSeleccion() {
        local.classList.remove('seleccionado');
        empate.classList.remove('seleccionado');
        visita.classList.remove('seleccionado');
    }

    local.addEventListener('click', () => {
        limpiarSeleccion();
        local.classList.add('seleccionado');
        inputHidden.value = 'local';
    });

    empate.addEventListener('click', () => {
        limpiarSeleccion();
        empate.classList.add('seleccionado');
        inputHidden.value = 'empate';
    });

    visita.addEventListener('click', () => {
        limpiarSeleccion();
        visita.classList.add('seleccionado');
        inputHidden.value = 'visita';
    });
});
