const apiURL = 'https://quinielamx.onrender.com';

async function obtenerQuinielasTabla() {
    try {
        // 1. Obtener jornada actual (partidos + resultados oficiales)
        const jornadaRes = await fetch(`${apiURL}/getJornada`);
        const jornadaData = await jornadaRes.json();
        const jornada = jornadaData.jornada;

        if (!jornada) {
            document.getElementById('quiniela').innerHTML =
                '<tr><td colspan="100%">No hay jornada configurada.</td></tr>';
            return;
        }

        document.querySelector('h1').textContent = `Jornada ${jornada.numero}`;

        // 2. Construir encabezados de la tabla dinámicamente
        const trHeader = document.querySelector('.tr-header');
        trHeader.innerHTML = '<th>Participantes</th>';

        jornada.partidos.forEach(p => {
            const th = document.createElement('th');
            th.innerHTML = `
                <div class="header-partido">
                    <img src="./img/${p.localImg}" alt="${p.local}">
                    <img src="./img/${p.visitaImg}" alt="${p.visita}">
                </div>`;
            trHeader.appendChild(th);
        });

        const thAciertos = document.createElement('th');
        thAciertos.textContent = 'Aciertos';
        trHeader.appendChild(thAciertos);

        // 3. Obtener quinielas de esta jornada
        const quinRes = await fetch(`${apiURL}/getQuiniela?jornada=${jornada.numero}`);
        const quinData = await quinRes.json();

        const quinielaBody = document.getElementById('quiniela');
        quinielaBody.innerHTML = '';

        // 4. Comparar cada quiniela contra los resultados oficiales
        const resultadosOficiales = jornada.partidos.map(p => p.resultado);

        quinData.quinielas.forEach(q => {
            const tr = document.createElement('tr');

            const tdNombre = document.createElement('td');
            tdNombre.textContent = q.nombre;
            tr.appendChild(tdNombre);

            let aciertos = 0;

            q.partidos.forEach((p, index) => {
                const td = document.createElement('td');
                td.textContent = p.resultado;

                if (resultadosOficiales[index] && p.resultado === resultadosOficiales[index]) {
                    td.classList.add('ganador');
                    aciertos++;
                }

                tr.appendChild(td);
            });

            const tdAciertos = document.createElement('td');
            tdAciertos.textContent = aciertos;
            tr.appendChild(tdAciertos);

            quinielaBody.appendChild(tr);
        });

    } catch (error) {
        alert("Error al obtener las Quinielas.");
        console.error(error);
    }
}

obtenerQuinielasTabla();
