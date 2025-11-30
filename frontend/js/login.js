document.addEventListener('DOMContentLoaded', () => {
    console.log("JS de Login cargado");

    const form = document.getElementById('login-form');

    if (!form) {
        console.error("ERROR: No se encontró el formulario con id='loginForm'");
        return;
    }

    form.addEventListener('submit', async (event) => {
        // 1. Evitamos que la página se recargue sola
        event.preventDefault();
        console.log("Iniciando sesión");

        // 2. Capturamos los datos usando TUS ids del HTML
        const usuarioInput = document.getElementById('usuario').value;
        const passwordInput = document.getElementById('contrasena').value;

        // 3. Preparamos el paquete para el servidor
        // Nota: El backend espera 'username', aunque tu input se llame 'usuario'
        const credenciales = {
            username: usuarioInput, 
            password: passwordInput
        };

        try {
            // 4. Enviamos la petición POST
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credenciales)
            });

            const data = await response.json();
            console.log("Respuesta del servidor:", data);

            if (response.ok) {
                alert('¡Bienvenido! Inicio de sesión exitoso.');
                window.location.href = '/perfil.html';
            } else {

                alert('Error: ' + (data.error || 'Credenciales incorrectas'));
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor.');
        }
    });
});