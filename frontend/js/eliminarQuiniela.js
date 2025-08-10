const apiURL = 'https://quinielamx.onrender.com';

async function eliminarQuiniela(id) {
    try {
        const res = await fetch(`${apiURL}/deleteQuiniela/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        alert(data.message);

        obtenerTenis();
    } catch(error) {
        alert("Error al eliminar Quiniela.");
        console.log(error)
    }
}