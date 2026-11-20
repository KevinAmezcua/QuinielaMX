async function renderPartidosInicio() {
    const contenedor = document.getElementById('contenedor-partidos');

    try {
        const res = await fetchWithRetry(`${apiURL}/getJornada`);
        const data = await res.json();

        if (!data.jornada) {
            contenedor.innerHTML = '<p class="aviso">No hay jornada configurada.</p>';
            return;
        }

        const { numero, partidos } = data.jornada;
        document.getElementById('jornada-titulo').textContent = `Jornada ${numero}`;

        contenedor.innerHTML = partidos.map(p => {
            const local  = escapeHTML(p.local);
            const visita = escapeHTML(p.visita);
            return `
                <div class="tarjeta-partido">
                    <div class="equipo-card">
                        <img src="./img/${escapeHTML(p.localImg)}" alt="${local}">
                        <span class="equipo-nombre">${local}</span>
                    </div>
                    <div class="card-centro">
                        <span class="vs">VS</span>
                        <p class="card-fecha"><i class="fa-regular fa-calendar"></i> ${escapeHTML(formatFecha(p.fecha))}</p>
                        <p class="card-hora"><i class="fa-regular fa-clock"></i> ${escapeHTML(formatHora(p.hora))}</p>
                    </div>
                    <div class="equipo-card">
                        <img src="./img/${escapeHTML(p.visitaImg)}" alt="${visita}">
                        <span class="equipo-nombre">${visita}</span>
                    </div>
                </div>`;
        }).join('');

    } catch (error) {
        contenedor.innerHTML = '<p class="aviso">Error al cargar los partidos.</p>';
    }
}

renderPartidosInicio();
