// =============================================================================
// LÓGICA DE NOTIFICACIÓN WHATSAPP (MIGRADO DE NOTIFICAR.HTML)
// =============================================================================

// Variable global interna para almacenar la URL que nos devuelva el backend al procesar
let urlGeneradaLocal = "";

/**
 * Recopila los datos cargados en el formulario y abre la API de WhatsApp
 */
function notificar() {
  console.log("[LOG] Extrayendo datos por atributo 'name'...");

  // Helper para capturar valor por 'name'
  const getValByName = (name) => {
    const el = document.getElementsByName(name)[0];
    return el ? el.value.trim() : "";
  };

  // Captura de datos del formulario
  const nom = getValByName("paciente_nombre");
  const ape = getValByName("paciente_apellido");
  const dni = getValByName("paciente_dni");
  const os  = getValByName("obra_social");
  
  // Sede Rosario - Número oficial de recepción
  const telefonoSede = "5493413765553"; 

  const paciente = (ape + " " + nom).trim() || "No especificado";

  // Validación de seguridad del teléfono
  if (!telefonoSede) {
    alert("Error: Teléfono del destinatario no configurado.");
    return;
  }

  // Construcción del mensaje con formato enriquecido para WhatsApp
  let mensaje = 
    "*REGISTRO COMPLETO*\n" +
    "*____________________*\n\n" +
    "*Paciente:* " + paciente + "\n" +
    "*DNI:* " + (dni || "N/A") + "\n" +
    "*Obra Social:* " + (os || "N/A") + "\n";

  // Si el backend nos devolvió un enlace, lo agregamos al mensaje de WhatsApp
  if (urlGeneradaLocal) {
    mensaje += "\n*Registro en línea:* \n" + urlGeneradaLocal;
  }

  const urlWa = "https://wa.me/" + telefonoSede + "?text=" + encodeURIComponent(mensaje);
  
  window.open(urlWa, "_blank");
}

/**
 * Abre visualmente el modal de éxito y opcionalmente almacena la URL del documento creado
 * @param {string} urlPdf - Enlace al PDF/Ficha generado en Google Drive
 */
function abrirModalExito(urlPdf) {
  if (urlPdf) {
    urlGeneradaLocal = urlPdf;
  }
  document.getElementById('modal-registro-ok').style.display = 'flex';
}