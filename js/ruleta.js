// ruleta.js (versión más simple)

let saldo = localStorage.getItem("saldo") ? parseInt(localStorage.getItem("saldo")) : 245000;
let apuesta = 0;
let tipo = "";

let saldoTexto = document.getElementById("saldo");
let resultadoTexto = document.getElementById("resultado");
let tipoApuesta = document.getElementById("tipo-apuesta");
let monto = document.getElementById("monto");
let apostar = document.getElementById("apostar");
let girar = document.getElementById("girar");
let estado = document.getElementById("estado");

saldoTexto.textContent = "$" + saldo;

// Registrar apuesta
apostar.addEventListener("click", function() {
    tipo = tipoApuesta.value;
    apuesta = parseInt(monto.value);

    if (tipo === "" || isNaN(apuesta) || apuesta < 1000) {
        alert("Ingrese tipo de apuesta y monto válido (mínimo $1000).");
        return;
    }

    if (apuesta > saldo) {
        alert("No tiene suficiente saldo.");
        return;
    }

    alert("Apuesta registrada: " + tipo + " por $" + apuesta);
});

// Girar ruleta
girar.addEventListener("click", function() {
    if (apuesta <= 0 || tipo === "") {
        alert("Primero debe realizar una apuesta.");
        return;
    }

    estado.textContent = "Girando...";

    let numero = Math.floor(Math.random() * 37);
    let color = "";

    let rojos = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    let negros = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

    if (rojos.includes(numero)) color = "Rojo";
    else if (negros.includes(numero)) color = "Negro";
    else color = "Verde";

    resultadoTexto.textContent = numero + " " + color;

    let gana = false;

    if (tipo === "rojo" && color === "Rojo") gana = true;
    if (tipo === "negro" && color === "Negro") gana = true;
    if (tipo === "par" && numero !== 0 && numero % 2 === 0) gana = true;
    if (tipo === "impar" && numero % 2 === 1) gana = true;

    if (gana) {
        saldo = saldo + apuesta;
        alert("Ganaste! Número: " + numero + " " + color);
    } else {
        saldo = saldo - apuesta;
        alert("Perdiste. Número: " + numero + " " + color);
    }

    localStorage.setItem("saldo", saldo);
    saldoTexto.textContent = "$" + saldo;
    estado.textContent = "Ruleta lista";
    localStorage.setItem("ultimoResultado", numero + " " + color);
});

// Cargar último resultado
if (localStorage.getItem("ultimoResultado")) {
    resultadoTexto.textContent = localStorage.getItem("ultimoResultado");
}