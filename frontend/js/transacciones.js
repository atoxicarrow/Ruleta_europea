document.addEventListener('DOMContentLoaded', () => {
    verificarSesionYDatos();
    configurarEventos();
});

let transaccionPendiente = null;

// 1. CARGAR DATOS (Saldo e Historial)
async function verificarSesionYDatos() {
    try {
        // [cite: 37, 72] Sincronización de saldo y datos
        const response = await fetch('/api/user/profile');
        
        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login.html'; // [cite: 41] Redirección si no hay sesión
            return;
        }

        const data = await response.json();
        
        // A. Actualizar Saldo Visual
        document.getElementById('saldo-actual').textContent = `$${data.balance}`;

        // B. Llenar Tabla de Historial
        const tbody = document.getElementById('cuerpo-historial');
        tbody.innerHTML = ''; // Limpiar tabla

        // Ordenar transacciones: las más nuevas primero
        const historial = data.transacciones ? data.transacciones.reverse() : [];

        historial.forEach(tx => {
            const fila = document.createElement('tr');
            
            // Formatear fecha
            const fecha = new Date(tx.fecha).toLocaleDateString() + ' ' + new Date(tx.fecha).toLocaleTimeString();
            
            // Definir color y signo según tipo
            const esDeposito = tx.tipo === 'deposito';
            const claseMonto = esDeposito ? 'monto-positivo' : 'monto-negativo'; // Asegúrate de tener CSS para esto o usa estilos inline
            const signo = esDeposito ? '+' : '-';

            fila.innerHTML = `
                <td>${fecha}</td>
                <td>${tx.descripcion || tx.tipo.toUpperCase()}</td>
                <td class="${claseMonto}">${signo} $${tx.monto}</td>
                <td>Completado</td>
            `;
            tbody.appendChild(fila);
        });
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// 2. EVENTOS (Sin cambios mayores, solo refactorización)
function configurarEventos() {
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const modalResultado = document.getElementById('modal-resultado');
    const btnConfirmar = document.getElementById('modal-confirmar');
    const btnCancelar = document.getElementById('modal-cancelar');
    const btnAceptarResultado = document.getElementById('resultado-aceptar');
    const spansCerrar = document.querySelectorAll('.cerrar');

    // Depósito
    document.getElementById('form-deposito').addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = document.getElementById('monto-deposito').value;
        transaccionPendiente = { tipo: 'deposito', amount: monto, endpoint: '/api/user/deposit' };
        mostrarModalConfirmacion(`¿Confirmas depositar $${monto}?`);
    });

    // Retiro
    document.getElementById('form-retiro').addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = document.getElementById('monto-retiro').value;
        transaccionPendiente = { tipo: 'retiro', amount: monto, endpoint: '/api/user/withdraw' };
        mostrarModalConfirmacion(`¿Confirmas retirar $${monto}?`);
    });

    // Confirmar Acción
    btnConfirmar.addEventListener('click', async () => {
        modalConfirmacion.style.display = 'none';
        if (transaccionPendiente) await ejecutarTransaccion(transaccionPendiente);
    });

    // Cerrar Modales
    btnCancelar.addEventListener('click', () => modalConfirmacion.style.display = 'none');
    spansCerrar.forEach(s => s.addEventListener('click', () => {
        modalConfirmacion.style.display = 'none';
        modalResultado.style.display = 'none';
    }));
    
    // Al aceptar resultado, recargar datos para ver el nuevo historial
    btnAceptarResultado.addEventListener('click', () => {
        modalResultado.style.display = 'none';
        verificarSesionYDatos(); // [cite: 37] Refrescar datos
    });
}

// 3. EJECUTAR API
async function ejecutarTransaccion(datos) {
    try {
        const response = await fetch(datos.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: datos.amount })
        });

        const result = await response.json();

        if (response.ok) {
            mostrarModalResultado('Éxito', result.message);
            document.getElementById('form-deposito').reset();
            document.getElementById('form-retiro').reset();
        } else {
            mostrarModalResultado('Error', result.error || 'Falló la transacción.');
        }
    } catch (error) {
        mostrarModalResultado('Error', 'Error de conexión.');
    }
}

document.getElementById('numero-tarjeta').addEventListener('input', function(e) {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
});

// CVV
document.getElementById('cvv').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

function mostrarModalConfirmacion(msg) {
    document.getElementById('modal-mensaje').textContent = msg;
    document.getElementById('modal-confirmacion').style.display = 'block';
}

function mostrarModalResultado(titulo, msg) {
    document.getElementById('resultado-titulo').textContent = titulo;
    document.getElementById('resultado-mensaje').textContent = msg;
    document.getElementById('modal-resultado').style.display = 'block';
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error("Error al salir:", error);
        }
    });
}