const NOMBRE_VALIDO = /^[\p{L}\p{N} .'-]+$/u;

async function enviarQuiniela() {
    const nombre = document.getElementById('nombre').value.replace(/\s+/g, ' ').trim();
    const contenedor = document.getElementById('partidos-form');
    const partidosDOM = contenedor.querySelectorAll('.partido');
    const btn = document.getElementById('btn-enviar');

    const partidos = Array.from(partidosDOM).map(partido => ({
        local:     partido.dataset.local || '',
        visita:    partido.dataset.visita || '',
        resultado: partido.querySelector('.resultado-oculto')?.value
    }));

    if (nombre.length < 2) {
        toast('Por favor ingresa tu nombre (mínimo 2 caracteres).', 'error');
        document.getElementById('nombre').focus();
        return;
    }
    if (nombre.length > 40 || !NOMBRE_VALIDO.test(nombre)) {
        toast("El nombre solo puede tener letras, números, espacios y . ' - (máximo 40).", 'error');
        return;
    }
    const faltantes = partidos.filter(p => !p.resultado).length;
    if (faltantes > 0) {
        toast(`Te falta${faltantes > 1 ? 'n' : ''} ${faltantes} partido${faltantes > 1 ? 's' : ''} por elegir.`, 'error');
        return;
    }

    const ok = await confirmar(`Se enviará tu quiniela a nombre de "${nombre}". Después ya no podrás modificarla.`,
        { titulo: '¿Enviar quiniela?', aceptar: 'Enviar' });
    if (!ok) return;

    btn.disabled = true;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

    try {
        const res = await fetchWithRetry(`${apiURL}/newQuiniela`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, partidos })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            borrarBorrador();
            window.location.href = `./resultados.html?yo=${encodeURIComponent(nombre)}`;
            return;
        }
        toast(data.message || 'Error al enviar la quiniela.', 'error', 6000);
    } catch (error) {
        toast('Error al enviar la quiniela. Revisa tu conexión.', 'error');
        console.error(error);
    }

    btn.disabled = false;
    btn.innerHTML = textoOriginal;
}
