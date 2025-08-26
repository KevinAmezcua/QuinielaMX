const apiURL = 'https://quinielamx.onrender.com';

const resultadosOficiales = [
<<<<<<< HEAD
    "", // Partido 1
    "", // Partido 2
    "", // Partido 3
    "", // Partido 4
    "", // Partido 5
    "", // Partido 6
    "", // Partido 7
    "", // Partido 8
    "" // Partido 9
=======
    "local", // Partido 1
    "local", // Partido 2
    "empate", // Partido 3
    "empate", // Partido 4
    "local", // Partido 5
    "empate", // Partido 6
    "local", // Partido 7
    "empate", // Partido 8
    "visita" // Partido 9
>>>>>>> b1765d413894e9396bc96a3dd0a55efac7da317a
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