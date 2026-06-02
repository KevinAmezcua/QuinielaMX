const apiURL = 'https://quinielamx.onrender.com';

function formatFecha(fecha) {
    if (!fecha || !fecha.includes('-')) return fecha;
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
}

async function renderFormPartidos() {
    const contenedor = document.getElementById('partidos-form');

    try {
        const res = await fetch(`${apiURL}/getJornada`);
        const data = await res.json();

        if (!data.jornada) {
            contenedor.innerHTML = '<p class="aviso">No hay jornada configurada.</p>';
            return;
        }

        const { numero, partidos } = data.jornada;
        document.querySelector('h1').textContent = `Jornada ${numero}`;
        contenedor.dataset.jornada = numero;

        contenedor.innerHTML = partidos.map(p => `
            <div class="partido">
                <div class="local"><img src="./img/${p.localImg}" alt="${p.local}"></div>
                <div class="empate"><h3>Empate</h3></div>
                <div class="visita"><img src="./img/${p.visitaImg}" alt="${p.visita}"></div>
                <input type="hidden" name="resultado[]" class="resultado-oculto" value="">
            </div>
        `).join('');

        initPartidoListeners();

    } catch (error) {
        contenedor.innerHTML = '<p class="aviso">Error al cargar los partidos.</p>';
    }
}

renderFormPartidos();
