document.addEventListener('DOMContentLoaded', async () => {
    // 1. Identificamos el menú
    const navUl = document.querySelector('.main-nav ul');
    if (!navUl) return;

    try {
        // 2. Preguntamos al servidor si hay usuario logueado
        // Usamos la misma ruta que en perfil para verificar token
        const response = await fetch('/api/user/profile');

        if (response.ok) {
            // =========================================
            // CASO 1: USUARIO LOGUEADO
            // =========================================
            const user = await response.json();
            
            // a) Eliminamos botones de "invitado" (Login/Registro)
            eliminarLinksPorHref(['/login.html', '/registro.html']);

            // b) Aseguramos que existan los links protegidos
            // (Si la página estática ya los tiene, no pasa nada. Si faltan, podrías agregarlos aquí)
            // Por simplicidad, asumimos que tu HTML base tiene los links comunes, 
            // y aquí agregamos el botón de Logout si no existe.

            if (!document.getElementById('btn-logout')) {
                const liLogout = document.createElement('li');
                const aLogout = document.createElement('a');
                aLogout.href = "#";
                aLogout.id = "btn-logout";
                aLogout.textContent = "Cerrar Sesión"; // O usar user.username para cumplir requisito [cite: 47]
                
                // Agregamos lógica de logout
                aLogout.addEventListener('click', manejarLogout);
                
                liLogout.appendChild(aLogout);
                navUl.appendChild(liLogout);
            }

            // Opcional: Mostrar nombre de usuario en el menú [cite: 47]
            // Buscamos el link de perfil y le cambiamos el texto
            const linkPerfil = navUl.querySelector('a[href="/perfil.html"]');
            if (linkPerfil) {
                linkPerfil.textContent = `Perfil (${user.username})`; 
            }

        } else {
            // =========================================
            // CASO 2: USUARIO NO LOGUEADO (INVITADO)
            // =========================================
            // a) Eliminamos links que requieren permiso 
            eliminarLinksPorHref([
                '/perfil.html', 
                '/transacciones.html', 
                '/ruleta.html'
            ]);

            // b) Eliminamos botón logout si existiera por error
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) btnLogout.parentElement.remove();
        }

    } catch (error) {
        console.error("Error gestionando menú:", error);
    }
});

// Función auxiliar para borrar items del menú según a dónde apunten
function eliminarLinksPorHref(listaHrefs) {
    const links = document.querySelectorAll('.main-nav ul li a');
    links.forEach(link => {
        // Obtenemos el path relativo del link (ej: /login.html)
        const path = link.getAttribute('href'); 
        if (listaHrefs.includes(path)) {
            link.parentElement.remove(); // Borramos el <li> completo
        }
    });
}

// Función compartida de Logout
async function manejarLogout(e) {
    e.preventDefault();
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (error) {
        console.error("Error al cerrar sesión", error);
    }
}