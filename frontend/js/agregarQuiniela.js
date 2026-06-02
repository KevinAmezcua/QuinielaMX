const apiURL = 'https://quinielamx.onrender.com';

async function enviarQuiniela() {
    const nombre = document.getElementById('nombre').value.trim();
    const contenedor = document.getElementById('partidos-form');
    const jornadaNum = parseInt(contenedor?.dataset.jornada) || null;
    const partidosDOM = contenedor.querySelectorAll('.partido');
    const partidos = [];

    partidosDOM.forEach(partido => {
        const localImg = partido.querySelector('.local img');
        const visitaImg = partido.querySelector('.visita img');
        const resultado = partido.querySelector('.resultado-oculto')?.value;

        if (resultado) {
            partidos.push({
                local: localImg ? localImg.alt : '',
                visita: visitaImg ? visitaImg.alt : '',
                resultado
            });
        }
    });

    if (!nombre) {
        alert("Por favor ingresa tu nombre.");
        return;
    }
    if (partidos.length !== partidosDOM.length) {
        alert("Debes seleccionar un resultado para todos los partidos.");
        return;
    }

    try {
        const res = await fetch(`${apiURL}/newQuiniela`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, partidos, jornada: jornadaNum })
        });

        const data = await res.json();
        alert(data.message);

        document.getElementById('nombre').value = '';
        contenedor.querySelectorAll('.resultado-oculto').forEach(input => input.value = '');
        contenedor.querySelectorAll('.seleccionado').forEach(div => div.classList.remove('seleccionado'));
        updateProgreso();

    } catch (error) {
        alert("Error al enviar la quiniela.");
        console.error(error);
    }
}
