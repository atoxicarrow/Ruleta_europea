document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
});
function cargarDatosIniciales() {
    
    // SALDO DESDE DOM
    const saldoGuardado = localStorage.getItem('saldoUsuario'); //CARGA DESDE LS EL SALDO ANTERIOR
    const saldoInicial = saldoGuardado ? parseInt(saldoGuardado) : 0;   //IGUALA EL SALDO INICIAL AL GUARDADO O 0 SI NO HAY
    actualizarSaldo(saldoInicial); //ACTUALIZA EL SALDO EN EL DOM
    
    cargarHistorial(); //CARGA EL HISTORIAL DESDE EL LS
}

// DEPOSITO
document.getElementById('form-deposito').addEventListener('submit', function(e) { // EVENTO AL ENVIAR FORMULARIO
    e.preventDefault();     //EVITA QUE SE RECARGUE LA PAGINA
    
    const monto = parseInt(document.getElementById('monto-deposito').value); // OBTIENE EL MONTO
    const titular = document.getElementById('nombre-titular-deposito').value; // OBTIENE EL NOMBRE DEL TITULAR
    
    if (validarFormularioDeposito()) { // VALIDA EL FORMULARIO CON LA FUNCION
        mostrarConfirmacion('deposito', monto, titular);
    }
});

// RETIRO
document.getElementById('form-retiro').addEventListener('submit', function(e) { // EVENTO AL ENVIAR FORMULARIO
    e.preventDefault();    //EVITA QUE SE RECARGUE LA PAGINA
    
    const monto = parseInt(document.getElementById('monto-retiro').value);  // OBTIENE EL MONTO
    const titular = document.getElementById('nombre-titular-retiro').value; // OBTIENE EL NOMBRE DEL TITULAR
    
    if (validarFormularioRetiro()) { // VALIDA EL FORMULARIO CON LA FUNCION
        mostrarConfirmacion('retiro', monto, titular);
    }
});

// NUMERO TARJETA
document.getElementById('numero-tarjeta').addEventListener('input', function(e) {   // EVENTO AL INGRESAR NUMERO DE TARJETA
    let value = e.target.value.replace(/[^0-9]/g, '');  //ELIMINA TODO LO QUE NO SEA NUMERO
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;    //SEPARA TODO EN GRUPOS DE 4
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
    const tarjeta = document.getElementById('numero-tarjeta').value.replace(/\s/g, ''); //Quita espacios del numero de tarjeta
    const cvv = document.getElementById('cvv').value;   //Obtiene el CVV
    var fecha = document.getElementById('fecha-expiracion').value;  //Obtiene la fecha de expiracion
    
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
    const saldoActual = obtenerSaldoActual();
    
    if (monto > saldoActual) {
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
    const saldoActual = obtenerSaldoActual();
    let nuevoSaldo = saldoActual;
    
    if (tipo === 'deposito') {
        nuevoSaldo += monto;
        agregarAlHistorial('Depósito', monto, 'Completado');
        mostrarResultado('Éxito', `Depósito de $${monto} CLP realizado exitosamente`);
    } else {
        nuevoSaldo -= monto;
        agregarAlHistorial('Retiro', -monto, 'Completado');
        mostrarResultado('Éxito', `Retiro de $${monto} CLP realizado exitosamente`);
    }
    
    actualizarSaldo(nuevoSaldo);
    guardarEnLocalStorage();
}

// SALDO DESDE DOM
function obtenerSaldoActual() {
    const saldoActual = document.getElementById('saldo-actual');
    return parseInt(saldoActual.textContent.replace('$', '').replace(' CLP', ''));
}

//SALDO NUEVO
function actualizarSaldo(nuevoSaldo) {
    document.getElementById('saldo-actual').textContent = `$${nuevoSaldo} CLP`;
    localStorage.setItem('saldoUsuario', nuevoSaldo.toString());
}

// GUARDAR EN LOCAL STORAGE
function guardarEnLocalStorage() {
    const saldo = obtenerSaldoActual();
    localStorage.setItem('saldoUsuario', saldo.toString());
    const historial = obtenerHistorialActual();
    localStorage.setItem('historialTransacciones', JSON.stringify(historial));
}

// HISTORIAL DESDE DOM
function obtenerHistorialActual() {
    const filas = document.getElementById('cuerpo-historial').querySelectorAll('tr');
    const historial = [];
    
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        historial.push({
            fecha: celdas[0].textContent,
            descripcion: celdas[1].textContent,
            monto: celdas[2].textContent,
            estado: celdas[3].textContent
        });
    });
    
    return historial;
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
    
    guardarEnLocalStorage();
}

function cargarHistorial() {
    const historialGuardado = localStorage.getItem('historialTransacciones');
    
    if (historialGuardado) {
        const historial = JSON.parse(historialGuardado);
        const cuerpoHistorial = document.getElementById('cuerpo-historial');
        cuerpoHistorial.innerHTML = '';
        
        historial.forEach(transaccion => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${transaccion.fecha}</td>
                <td>${transaccion.descripcion}</td>
                <td>${transaccion.monto}</td>
                <td>${transaccion.estado}</td>
            `;
            cuerpoHistorial.appendChild(fila);
        });
    }
}

function mostrarResultado(titulo, mensaje) {
    document.getElementById('resultado-titulo').textContent = titulo;
    document.getElementById('resultado-mensaje').textContent = mensaje;
    document.getElementById('modal-resultado').style.display = 'block';
}