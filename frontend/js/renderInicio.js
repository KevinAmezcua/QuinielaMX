const apiURL = 'https://quinielamx.onrender.com';

function formatFecha(fecha) {
    if (!fecha || !fecha.includes('-')) return fecha;
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}

async function renderPartidosInicio() {
    const contenedor = document.getElementById('contenedor-partidos');

    try {
        const res = await fetch(`${apiURL}/getJornada`);
        const data = await res.json();

        if (!data.jornada) {
            contenedor.innerHTML = '<p class="aviso">No hay jornada configurada.</p>';
            return;
        }

        const { numero, partidos } = data.jornada;
        document.querySelector('h1').textContent = `Jornada ${numero}`;

        contenedor.innerHTML = partidos.map(p => `
            <div class="tarjeta-partido">
                <img src="./img/${p.localImg}" alt="${p.local}">
                <img src="./img/${p.visitaImg}" alt="${p.visita}">
                <p><i class="fa-regular fa-calendar"></i> ${formatFecha(p.fecha)}</p>
                <p><i class="fa-regular fa-clock"></i> ${p.hora}</p>
            </div>
        `).join('');

    } catch (error) {
        contenedor.innerHTML = '<p class="aviso">Error al cargar los partidos.</p>';
    }
}

renderPartidosInicio();
