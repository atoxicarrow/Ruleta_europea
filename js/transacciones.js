let boton = document.getElementById('btn-depositar');
let modal = document.getElementById('miModal');
let cerrar = document.querySelector('.cerrar');

boton.addEventListener('click', function() {
  modal.style.display = 'block';
});

cerrar.addEventListener('click', function() {
  modal.style.display = 'none';
});


