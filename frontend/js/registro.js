document.addEventListener('DOMContentLoaded', () => {
    console.log("🟢 Script de registro cargado correctamente");

    const form = document.getElementById('registro-form');

    // 1. Verificación de seguridad: ¿Existe el formulario?
    if (!form) {
        console.error("🔴 ERROR CRÍTICO: No se encontró el formulario con id='registroForm'");
        return;
    }

    form.addEventListener('submit', async (event) => {
        // 2. Evitar recarga automática
        event.preventDefault();
        console.log("🔵 Botón presionado. Iniciando proceso...");

        // 3. Captura manual de datos para asegurar nombres correctos
        const nombreVal = document.getElementById('nombre').value;
        const usuarioVal = document.getElementById('usuario').value;
        const emailVal = document.getElementById('correo').value;
        const edadVal = document.getElementById('edad').value;
        const passVal = document.getElementById('contrasena').value;
        const confirmPassVal = document.getElementById('confirmar-contrasena').value;

        // 4. Validación básica de contraseñas
        if (passVal !== confirmPassVal) {
            alert('Las contraseñas no coinciden');
            return;
        }

        // Objeto listo para el backend
        const usuarioParaEnviar = {
            nombreCompleto: nombreVal,
            username: usuarioVal,
            email: emailVal,
            fechaNacimiento: edadVal,
            password: passVal
        };

        console.log("📦 Datos preparados:", usuarioParaEnviar);

        try {
            // 5. Envío al servidor
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usuarioParaEnviar)
            });

            const resultado = await response.json();
            console.log("ump Respuesta del servidor:", resultado);

            if (response.ok) {
                alert('¡Registro exitoso! Redirigiendo al login...');
                window.location.href = '/login.html';
            } else {
                alert('Error al registrar: ' + (resultado.error || 'Desconocido'));
            }

        } catch (error) {
            console.error('🔴 Error de conexión:', error);
            alert('Hubo un error al intentar conectar con el servidor.');
        }
    });
});