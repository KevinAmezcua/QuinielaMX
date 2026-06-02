function toggleNav() {
    const links  = document.getElementById('nav-links');
    const toggle = document.getElementById('nav-toggle');
    if (!links || !toggle) return;

    const isOpen = links.classList.toggle('nav-open');
    toggle.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
    document.body.classList.toggle('nav-overflow', isOpen);
}

document.addEventListener('DOMContentLoaded', () => {
    // Cerrar al hacer clic en un enlace
    document.querySelectorAll('#nav-links a').forEach(a => {
        a.addEventListener('click', () => {
            const links  = document.getElementById('nav-links');
            const toggle = document.getElementById('nav-toggle');
            links?.classList.remove('nav-open');
            document.body.classList.remove('nav-overflow');
            if (toggle) toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });

    // Cerrar al hacer clic fuera del menú
    document.addEventListener('click', (e) => {
        const links = document.getElementById('nav-links');
        if (links?.classList.contains('nav-open') && !e.target.closest('header')) {
            links.classList.remove('nav-open');
            document.body.classList.remove('nav-overflow');
            const toggle = document.getElementById('nav-toggle');
            if (toggle) toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
    });
});
