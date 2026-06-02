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

    if (!confirm(`¿Deseas enviar tu quiniela como "${nombre}"?`)) return;

    try {
        const res = await fetch(`${apiURL}/newQuiniela`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, partidos, jornada: jornadaNum })
        });

        const data = await res.json();

        if (res.ok) {
            window.location.href = './resultados.html';
        } else {
            alert(data.message || "Error al enviar la quiniela.");
        }

    } catch (error) {
        alert("Error al enviar la quiniela.");
        console.error(error);
    }
}
