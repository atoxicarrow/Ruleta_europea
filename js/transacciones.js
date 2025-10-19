// DEPOSITO
document.getElementById('form-deposito').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const monto = parseInt(document.getElementById('monto-deposito').value);
    const titular = document.getElementById('nombre-titular-deposito').value;
    
    if (validarFormularioDeposito()) {
        mostrarConfirmacion('deposito', monto, titular);
    }
});

// RETIRO
document.getElementById('form-retiro').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const monto = parseInt(document.getElementById('monto-retiro').value);
    const titular = document.getElementById('nombre-titular-retiro').value;
    
    if (validarFormularioRetiro()) {
        mostrarConfirmacion('retiro', monto, titular);
    }
});

// NUMERO TARJETA
document.getElementById('numero-tarjeta').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
});

// CVV
document.getElementById('cvv').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// MODAL
document.querySelectorAll('.cerrar').forEach(cerrar => {
    cerrar.addEventListener('click', function() {
        document.getElementById('modal-confirmacion').style.display = 'none';
        document.getElementById('modal-resultado').style.display = 'none';
    });
});

document.getElementById('modal-cancelar').addEventListener('click', function() {
    document.getElementById('modal-confirmacion').style.display = 'none';
});

document.getElementById('resultado-aceptar').addEventListener('click', function() {
    document.getElementById('modal-resultado').style.display = 'none';
});

// VALIDACION DE DATOS (LARGO DE ESTOS)
function validarFormularioDeposito() {
    const tarjeta = document.getElementById('numero-tarjeta').value.replace(/\s/g, '');
    const cvv = document.getElementById('cvv').value;
    var fecha = document.getElementById('fecha-expiracion').value;
    
    if (tarjeta.length !== 16) {
        mostrarResultado('Error', 'Número de tarjeta inválido');
        return false;
    }
    
    if (cvv.length !== 3) {
        mostrarResultado('Error', 'CVV inválido');
        return false;
    }
    
    if (!fecha) {
        mostrarResultado('Error', 'Fecha de expiración requerida');
        return false;
    }
    
    return true;
}

function validarFormularioRetiro() {
    const monto = parseInt(document.getElementById('monto-retiro').value);
    const saldoActual = document.getElementById('saldo-actual');
    const saldo = parseInt(saldoActual.textContent.replace('$', '').replace(' CLP', ''));
    
    if (monto > saldo) {
        mostrarResultado('Error', 'Saldo insuficiente para realizar el retiro');
        return false;
    }
    
    return true;
}

// VER CONFIRMAR
function mostrarConfirmacion(tipo, monto, titular) {
    const modalTitulo = document.getElementById('modal-titulo');
    const modalMensaje = document.getElementById('modal-mensaje');
    
    modalTitulo.textContent = `Confirmar ${tipo === 'deposito' ? 'Depósito' : 'Retiro'}`;
    modalMensaje.textContent = `¿Está seguro que desea ${tipo === 'deposito' ? 'depositar' : 'retirar'} $${monto} CLP a favor de ${titular}?`;
    
    //CONFIRMAR
    const btnConfirmar = document.getElementById('modal-confirmar');
    btnConfirmar.onclick = function() {
        procesarTransaccion(tipo, monto);
        document.getElementById('modal-confirmacion').style.display = 'none';
    };
    
    document.getElementById('modal-confirmacion').style.display = 'block';
}

//AGREGAR SALDO
function procesarTransaccion(tipo, monto) {
    const saldoActual = document.getElementById('saldo-actual');
    let saldo = parseInt(saldoActual.textContent.replace('$', '').replace(' CLP', ''));
    
    if (tipo === 'deposito') {
        saldo += monto;
        agregarAlHistorial('Depósito', monto, 'Completado');
        mostrarResultado('Éxito', `Depósito de $${monto} CLP realizado exitosamente`);
    } else {
        saldo -= monto;
        agregarAlHistorial('Retiro', -monto, 'Completado');
        mostrarResultado('Éxito', `Retiro de $${monto} CLP realizado exitosamente`);
    }
    
    actualizarSaldo(saldo);
}

//SALDO NUEVO
function actualizarSaldo(nuevoSaldo) {
    document.getElementById('saldo-actual').textContent = `$${nuevoSaldo} CLP`;
}

function agregarAlHistorial(descripcion, monto, estado) {
    const fecha = new Date().toLocaleDateString('es-CL');
    const fila = document.createElement('tr');
    
    fila.innerHTML = `
        <td>${fecha}</td>
        <td>${descripcion}</td>
        <td>${monto > 0 ? '+' : ''}$${monto} CLP</td>
        <td>${estado}</td>
    `;
    
    document.getElementById('cuerpo-historial').insertBefore(fila, document.getElementById('cuerpo-historial').firstChild);
}

function mostrarResultado(titulo, mensaje) {
    document.getElementById('resultado-titulo').textContent = titulo;
    document.getElementById('resultado-mensaje').textContent = mensaje;
    document.getElementById('modal-resultado').style.display = 'block';
}
