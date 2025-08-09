const apiURL = 'https://quinielamx.onrender.com';

async function enviarQuiniela() {
    const nombre = document.getElementById('nombre').value.trim();
    const partidosDOM = document.querySelectorAll('.partido');
    const partidos = [];

    // Omitimos el primer div que es solo encabezado
    partidosDOM.forEach((partido, index) => {
        if (index === 0) return; 

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

    // Validaciones
    if (!nombre) {
        alert("Por favor ingresa tu nombre.");
        return;
    }
    if (partidos.length !== 9) {
        alert("Debes seleccionar un resultado para todos los partidos.");
        return;
    }

    try {
        const res = await fetch(`${apiURL}/newQuiniela`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, partidos })
        });

        const data = await res.json();
        alert(data.message);

        // Limpiar formulario
        document.getElementById('nombre').value = '';
        document.querySelectorAll('.resultado-oculto').forEach(input => input.value = '');
        document.querySelectorAll('.seleccionado').forEach(div => div.classList.remove('seleccionado'));

    } catch (error) {
        alert("Error al enviar la quiniela.");
        console.error(error);
    }
}

async function obtenerQuinielas() {
    try {
        const res = await fetch(`${apiURL}/getQuiniela`);
        const data = await res.json();

        const quinielaBody = document.getElementById('quiniela');
        quinielaBody.innerHTML = '';
        
        data.quinielas.forEach(q => {
            const tr = document.createElement('tr');
            
            let tdNombre = document.createElement('td');
            tdNombre.textContent = q.nombre;
            tr.appendChild(tdNombre);

            q.partidos.forEach(p => {
                let td = document.createElement('td');
                td.textContent = p.resultado; // "Local", "Visita" o "Empate"
                tr.appendChild(td);
            });

            quinielaBody.appendChild(tr);
        });
    } catch(error) {
        alert("Error al obtener las Quinielas.");
        console.log(error)
    }
}

obtenerQuinielas();