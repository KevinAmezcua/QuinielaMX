function formatFecha(fecha) {
    if (!fecha || !fecha.includes('-')) return fecha;
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}

function formatHora(hora) {
    if (!hora) return hora;
    const [h, m] = hora.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

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

        contenedor.innerHTML = partidos.map(p => `
            <div class="tarjeta-partido">
                <div class="equipo-card">
                    <img src="./img/${p.localImg}" alt="${p.local}">
                    <span class="equipo-nombre">${p.local}</span>
                </div>
                <div class="card-centro">
                    <span class="vs">VS</span>
                    <p class="card-fecha"><i class="fa-regular fa-calendar"></i> ${formatFecha(p.fecha)}</p>
                    <p class="card-hora"><i class="fa-regular fa-clock"></i> ${formatHora(p.hora)}</p>
                </div>
                <div class="equipo-card">
                    <img src="./img/${p.visitaImg}" alt="${p.visita}">
                    <span class="equipo-nombre">${p.visita}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        contenedor.innerHTML = '<p class="aviso">Error al cargar los partidos.</p>';
    }
}

renderPartidosInicio();
