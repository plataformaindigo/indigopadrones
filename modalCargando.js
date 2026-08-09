function mostrarModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) {
    modal.style.display = "flex";
  } else {
    console.warn("No se encontró el elemento con ID 'loadingModal' en el DOM.");
  }
}

function ocultarModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) {
    modal.style.display = "none";
  }
}