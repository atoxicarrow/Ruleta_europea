// Obtener elementos
const boton = document.getElementById('btn-depositar');
const modal = document.getElementById('miModal');
const cerrar = document.querySelector('.cerrar');

// Abrir modal al hacer clic en el botón
boton.addEventListener('click', function() {
  modal.style.display = 'block';
});

// Cerrar modal al hacer clic en la X
cerrar.addEventListener('click', function() {
  modal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', function(event) {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});