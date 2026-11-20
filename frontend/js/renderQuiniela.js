async function renderFormPartidos() {
    const contenedor = document.getElementById('partidos-form');

    try {
        const res  = await fetchWithRetry(`${apiURL}/getJornada`);
        const data = await res.json();

        if (!data.jornada) {
            contenedor.innerHTML = '<p class="aviso">No hay jornada configurada.</p>';
            document.querySelector('.form-footer').style.display = 'none';
            return;
        }

        const { numero, partidos, aceptaEnvios, cierreEnvios } = data.jornada;
        document.querySelector('h1').textContent = `Jornada ${numero}`;
        contenedor.dataset.jornada = numero;

        if (!aceptaEnvios) {
            document.querySelector('.form-footer').style.display = 'none';
            document.getElementById('progreso-wrap').style.display = 'none';
            contenedor.innerHTML = `
                <div class="aviso-cerrado">
                    <i class="fa-solid fa-lock"></i>
                    <p>Envíos cerrados</p>
                    <span>Ya no es posible enviar quinielas para esta jornada.</span>
                    <a href="./resultados.html" class="aviso-cerrado-link">Ver resultados <i class="fa-solid fa-arrow-right"></i></a>
                </div>`;
            return;
        }

        const totalEl = document.getElementById('progreso-total');
        if (totalEl) totalEl.textContent = `/${partidos.length}`;

        mostrarCierre(cierreEnvios);

        contenedor.innerHTML = partidos.map(p => {
            const local  = escapeHTML(p.local);
            const visita = escapeHTML(p.visita);
            return `
                <div class="partido" data-local="${local}" data-visita="${visita}">
                    <div class="local" role="button" tabindex="0" aria-label="Gana ${local}">
                        <img src="./img/${escapeHTML(p.localImg)}" alt="${local}">
                        <span class="equipo-form-nombre">${local}</span>
                    </div>
                    <div class="empate" role="button" tabindex="0" aria-label="Empate">empate</div>
                    <div class="visita" role="button" tabindex="0" aria-label="Gana ${visita}">
                        <img src="./img/${escapeHTML(p.visitaImg)}" alt="${visita}">
                        <span class="equipo-form-nombre">${visita}</span>
                    </div>
                    <input type="hidden" name="resultado[]" class="resultado-oculto" value="">
                </div>`;
        }).join('');

        initPartidoListeners();
        restaurarBorrador();
        updateProgreso();

    } catch (error) {
        contenedor.innerHTML = '<p class="aviso">Error al cargar los partidos.</p>';
    }
}

// Muestra cuándo se cierran los envíos (inicio del primer partido).
function mostrarCierre(iso) {
    const el = document.getElementById('cierre-envios');
    if (!el || !iso) return;
    const fecha = new Date(iso).toLocaleString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit'
    });
    el.innerHTML = '<i class="fa-regular fa-clock"></i> ';
    el.append(`Envíos abiertos hasta el ${fecha}`);
    el.style.display = 'block';
}

renderFormPartidos();

window.addEventListener('pageshow', (e) => {
    if (e.persisted) window.location.reload();
});
