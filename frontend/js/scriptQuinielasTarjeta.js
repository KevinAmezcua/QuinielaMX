const apiURL = 'https://quinielamx.onrender.com';

async function obtenerQuinielaTarjeta() {
    try {
        const res = await fetch(`${apiURL}/getQuiniela`);
        const data = await res.json();

        const quinielaDiv = document.getElementById('obtenerTodas-quinielas');
        quinielaDiv.innerHTML = '';
        console.log(data);

        data.quinielas.forEach(quiniela => {
            const div = document.createElement('div');
            div.classList.add('quiniela');
            
            const respuestas = quiniela.partidos
                .map(p => p.resultado || "-")
                .join("<br>");

            div.innerHTML = `
                <h3>${quiniela.nombre}</h3>
                <h4>${respuestas}</h4>
                <button type="button" class="delete" onclick="eliminarQuiniela('${quiniela._id}')">Eliminar</button>
            `;

            quinielaDiv.appendChild(div);
        });
    } catch(error) {
        alert("Error al obtener las Quinielas.");
        console.log(error)
    }
}

async function eliminarQuiniela(id) {
    try {
        const res = await fetch(`${apiURL}/deleteQuiniela/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        console.log("Respuesta del servidor:", data);
        
        if (res.ok) {
            // si el backend devuelve deleted, lo mostramos
            if (data.deleted && data.deleted._id) {
                console.log("Se eliminó en DB el _id:", data.deleted._id);
            }
            alert(data.message);
            // reload seguro de la lista
            await obtenerQuinielaTarjeta();
        } else {
            alert(data.message || "Error al eliminar.");
        }
    } catch(error) {
        alert("Error al eliminar Quiniela.");
        console.log(error)
    }
}

obtenerQuinielaTarjeta();