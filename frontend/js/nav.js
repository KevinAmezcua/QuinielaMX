document.addEventListener('DOMContentLoaded', () => {
    const links  = document.getElementById('nav-links');
    const toggle = document.getElementById('nav-toggle');

    function openNav() {
        links.classList.add('nav-open');
        toggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        document.body.classList.add('nav-overflow');
    }

    function closeNav() {
        links.classList.remove('nav-open');
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        document.body.classList.remove('nav-overflow');
    }

    // Toggle al hacer clic en el botón hamburguesa
    toggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (links.classList.contains('nav-open')) {
            closeNav();
        } else {
            openNav();
        }
    });

    // Cerrar al hacer clic en un enlace
    links?.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeNav);
    });

    // Cerrar al hacer clic fuera del menú
    document.addEventListener('click', (e) => {
        if (links?.classList.contains('nav-open') && !e.target.closest('header')) {
            closeNav();
        }
    });
});
