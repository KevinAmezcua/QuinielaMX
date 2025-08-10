const apiURL = 'https://quinielamx.onrender.com';

const resultadosOficiales = [
    "local",
    "local",
    "empate",
    "visita", 
    "", 
    "",  
    "",
    "",
    "" 
];

async function obtenerQuinielasTabla() {
    try {
        const res = await fetch(`${apiURL}/getQuiniela`);
        const data = await res.json();

        const quinielaBody = document.getElementById('quiniela');
        quinielaBody.innerHTML = '';

        data.quinielas.forEach(q => {
            const tr = document.createElement('tr');

            // Nombre del jugador
            let tdNombre = document.createElement('td');
            tdNombre.textContent = q.nombre;
            tr.appendChild(tdNombre);

            let aciertos = 0;

            // Partidos
            q.partidos.forEach((p, index) => {
                let td = document.createElement('td');
                td.textContent = p.resultado; // mostrará "local", "empate" o "visita"

                // Si acierta
                if (p.resultado === resultadosOficiales[index]) {
                    td.classList.add('ganador');
                    aciertos++;
                }

                tr.appendChild(td);
            });

            // Aciertos
            let tdAciertos = document.createElement('td');
            tdAciertos.textContent = aciertos;
            tr.appendChild(tdAciertos);

            quinielaBody.appendChild(tr);
        });

    } catch (error) {
        alert("Error al obtener las Quinielas.");
    }
}

obtenerQuinielasTabla();