const apiURL = 'https://quinielamx.onrender.com';

async function obtenerQuinielaTarjeta() {
    try {
        const res = await fetch(`${apiURL}/getQuiniela`);
        const data = await res.json();

        const quinielaDiv = document.getElementById('obtener-quinielas');
        quinielaDiv.innerHTML = '';
        
        data.quinielas.forEach(quiniela => {
            const div = document.createElement('div');
            div.classList.add('tenis');
            
            div.innerHTML = `
                <img src="${teni.imagen}" alt="Sneaker" class="img-tenis">
                <div class="texto-tenis">
                    <h3>${teni.nombre}</h3>
                    <p>${teni.descripcion}</p>
                    <div class="UpdDel-tenis">
                        <span class="precio-tenis">$${teni.precio}</span>
                        <input type="submit" value="Actualizar" class="update" onclick="actualizarTenis('${teni._id}')">
                        <input type="submit" value="Eliminar" class="delete" onclick="eliminarTenis('${teni._id}')">
                    </div>
                </div>
            `;
            tenisDiv.appendChild(div);
        });
    } catch(error) {
        alert("Error al obtener los Productos.");
        console.log(error)
    }
}

obtenerQuinielaTarjeta();