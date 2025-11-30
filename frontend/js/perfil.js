document.addEventListener('DOMContentLoaded', async () => {
    console.log("🟢 Cargando perfil del usuario...");

    try {
        const response = await fetch('/api/user/profile');

        // SI NO ESTÁ LOGUEADO
        if (response.status === 401 || response.status === 403) {
            console.warn("⛔ No autorizado. Redirigiendo al login.");
            alert("Debes iniciar sesión para ver tu perfil.");
            window.location.href = '/login.html';
            return;
        }

        // PROCESAR DATOS
        if (response.ok) {
            const usuario = await response.json();
            console.log("Datos recibidos:", usuario);

            // DATOS REALES
            document.getElementById('header-nombre').textContent = usuario.username; 


            document.getElementById('info-nombre').textContent = usuario.nombreCompleto;
            document.getElementById('info-email').textContent = usuario.email;
            document.getElementById('info-usuario').textContent = usuario.username;
            
            const fecha = new Date(usuario.fechaNacimiento);
            document.getElementById('info-nacimiento').textContent = fecha.toLocaleDateString('es-CL');

            // Saldo
            document.getElementById('saldo-usuario').textContent = usuario.balance;
        }

    } catch (error) {
        console.error("Error cargando perfil:", error);
        alert("Error de conexión al cargar tus datos.");
    }

    // LÓGICA DE CERRAR SESIÓN (LOGOUT)

    const btnLogout = document.getElementById('btn-logout');
    
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("🔵 Cerrando sesión...");

            try {
                const response = await fetch('/api/auth/logout', { method: 'POST' });
                
                if (response.ok) {
                    alert('Sesión cerrada exitosamente.');
                    window.location.href = '/login.html';
                }
            } catch (error) {
                console.error("Error al salir:", error);
            }
        });
    }
});