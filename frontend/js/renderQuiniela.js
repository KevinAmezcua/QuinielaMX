function formatFecha(fecha) {
    if (!fecha || !fecha.includes('-')) return fecha;
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}

async function renderFormPartidos() {
    const contenedor = document.getElementById('partidos-form');

    try {
        const res  = await fetch(`${apiURL}/getJornada`);
        const data = await res.json();

        if (!data.jornada) {
            contenedor.innerHTML = '<p class="aviso">No hay jornada configurada.</p>';
            return;
        }

        const { numero, partidos } = data.jornada;
        document.querySelector('h1').textContent = `Jornada ${numero}`;
        contenedor.dataset.jornada = numero;

        // Inicializar total en barra de progreso
        const totalEl = document.getElementById('progreso-total');
        if (totalEl) totalEl.textContent = `/${partidos.length}`;

        contenedor.innerHTML = partidos.map(p => `
            <div class="partido">
                <div class="local">
                    <img src="./img/${p.localImg}" alt="${p.local}">
                    <span class="equipo-form-nombre">${p.local}</span>
                </div>
                <div class="empate">empate</div>
                <div class="visita">
                    <img src="./img/${p.visitaImg}" alt="${p.visita}">
                    <span class="equipo-form-nombre">${p.visita}</span>
                </div>
                <input type="hidden" name="resultado[]" class="resultado-oculto" value="">
            </div>
        `).join('');

        initPartidoListeners();
        updateProgreso();

    } catch (error) {
        contenedor.innerHTML = '<p class="aviso">Error al cargar los partidos.</p>';
    }
}

renderFormPartidos();
