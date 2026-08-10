// Agrega la URL de tu Aplicación Web desplegada en Google Apps Script
const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbw0LKiBZNxqcckMOtil1_0Z5HYXG2RZJu7Z5gtsnUHeoJKhnXIgCujTouUkXvABScDc/exec";

function enviarBackendBasico() {
  const form = document.getElementById("fichaForm");
  
  // 1. Recolección de fotos
  const fotos = obtenerTodasLasFotosJSON();
  
  // 2. Definición de fotos obligatorias (se excluyen las credenciales)
  const fotosObligatorias = {
    foto_vacunas: "Calendario Vacunas Frente",
    foto_vacunas2: "Calendario Vacunas Dorso",
    foto_dni_1: "DNI Paciente Frente",
    foto_dni_2: "DNI Paciente Reverso",
    foto_dnititular_1: "DNI Titular Frente",
    foto_dnititular_2: "DNI Titular Reverso",
    foto_partida: "Partida de Nacimiento",
    foto_cud: "Foto CUD"
  };

  let fotosFaltantes = [];

  // Verificación de campos vacíos
  for (const [clave, nombreHumano] of Object.entries(fotosObligatorias)) {
    if (!fotos[clave] || fotos[clave].trim() === "") {
      fotosFaltantes.push(nombreHumano);
    }
  }

  // Si falta alguna foto obligatoria, se frena el flujo y se notifica al usuario
  if (fotosFaltantes.length > 0) {
    alert("⚠️ No se puede enviar el formulario.\n\nFalta cargar las siguientes fotos obligatorias:\n- " + fotosFaltantes.join("\n- "));
    return; 
  }

  // 3. Bloqueo visual con el Modal de carga (si pasó la validación)
  mostrarModal();
  
  // 4. Recolección de datos de campos de texto
  const datosForm = Object.fromEntries(new FormData(form).entries());

  const payload = {
    form: datosForm,
    fotos: fotos,
    ts: new Date().toISOString()
  };

  console.log("➡️ ENVIANDO AL BACKEND CON MODAL ACTIVO:", payload);

  // Helper para procesar la respuesta exitosa en ambos entornos
  const manejarExito = (respuesta) => {
    ocultarModal();
    console.log("✅ RESPUESTA BACKEND:", respuesta);

    // Guardado de variables globales para WhatsApp antes del reset
    window.datosParaWhatsApp = {
      nombre: document.getElementsByName("paciente_nombre")[0]?.value.trim() || "",
      apellido: document.getElementsByName("paciente_apellido")[0]?.value.trim() || "",
      dni: document.getElementsByName("paciente_dni")[0]?.value.trim() || "",
      os: document.getElementsByName("obra_social")[0]?.value.trim() || ""
    };

    // Limpieza de las previsualizaciones de imágenes de la grilla
    document.querySelectorAll('.pic').forEach(img => {
      img.src = "";
      img.style.display = "none";
    });

    // Apertura del modal de éxito final
    if (typeof abrirModalExito === 'function') {
      abrirModalExito();
    } else {
      alert("✅ Ficha médica guardada correctamente.");
    }
  };

  // Helper para procesar errores
  const manejarError = (err) => {
    ocultarModal();
    console.error("❌ ERROR CRÍTICO:", err);
    alert("Error de conexión al intentar guardar la ficha.");
  };

  // 5. Envío adaptativo (Detecta si es Google Apps Script o Entorno Local)
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    // ENTORNO EN NUBE (Apps Script)
    google.script.run
      .withSuccessHandler(respuesta => {
        if (respuesta.ok) {
          manejarExito(respuesta);
        } else {
          ocultarModal();
          alert("El servidor reportó un error: " + respuesta.error);
        }
      })
      .withFailureHandler(err => manejarError(err))
      .backendBasico(payload);
  } else {
    // ENTORNO LOCAL (vía HTTP fetch POST)
    fetch(URL_WEB_APP, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8" // Evita la verificación pre-flight CORS en Apps Script
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(respuesta => {
      if (respuesta.ok) {
        manejarExito(respuesta);
      } else {
        ocultarModal();
        alert("El servidor reportó un error: " + respuesta.error);
      }
    })
    .catch(err => manejarError(err));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let currentStep = 0;
  const steps = document.querySelectorAll(".step");
  const form = document.getElementById("fichaForm");

  // --- NUEVO: Limpiador de errores en tiempo real ---
  form.addEventListener("input", (e) => {
    if (e.target.classList.contains("field-error")) {
      e.target.classList.remove("field-error");
    }
  });

  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });

    const currentStepEl = steps[index];
    const btnPrev = currentStepEl.querySelector("button[onclick='prevStep()']");
    const btnNext = currentStepEl.querySelector("button[onclick='nextStep()']");

    if (index === 0) {
      if (btnPrev) btnPrev.style.display = "none";
      if (btnNext) {
        btnNext.style.width = "100%";
        btnNext.style.flex = "none";
      }
    } else {
      if (btnPrev) btnPrev.style.display = "inline-block";
      if (btnNext) {
        btnNext.style.width = "auto"; 
        btnNext.style.flex = "1";
      }
    }

    if (index === steps.length - 1) {
      if (btnNext) btnNext.style.display = "none";
      if (!document.getElementById("btnGuardar")) {
        const btn = document.createElement("button");
        btn.id = "btnGuardar";
        btn.type = "button";
        btn.textContent = "💾 CONFIRMAR REGISTRO";
        btn.className = "btn-guardar-full"; 
        btn.onclick = enviarBackendBasico;
        currentStepEl.appendChild(btn);
      }
    } else {
      const guardar = document.getElementById("btnGuardar");
      if (guardar) guardar.remove();
    }
    
    window.scrollTo(0, 0);
  }

  //--- MODIFICADO: NextStep con validador y focus ---
  window.nextStep = function () {
    const currentStepEl = steps[currentStep];
    // Buscamos todos los inputs que no sean de solo lectura o estén ocultos
    const inputs = currentStepEl.querySelectorAll("input:not([readonly]):not([type='hidden'])");
    let primerError = null;
    let hayErrores = false;

    inputs.forEach(input => {
      if (input.value.trim() === "") {
        input.classList.add("field-error");
        hayErrores = true;
        if (!primerError) primerError = input;
      }
    });

    if (hayErrores) {
      if (primerError) primerError.focus();
      return; // Detiene la ejecución si hay campos vacíos
    }

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  };

  window.prevStep = function () {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  };

  showStep(currentStep);
});







function calcularEdad() {
  const fechaNacimientoInput = document.getElementById("paciente_fecha_nac");

  if (!fechaNacimientoInput.value) {
    return "";
  }

  const fechaNacimiento = new Date(fechaNacimientoInput.value);
  const hoy = new Date();

  let diferenciaMs = hoy - fechaNacimiento;
  if (diferenciaMs < 0) {
    return "La fecha de nacimiento no puede ser en el futuro.";
  }

  let edad = { anios: 0, meses: 0, dias: 0 };

  edad.anios = hoy.getFullYear() - fechaNacimiento.getFullYear();

  if (
    hoy.getMonth() < fechaNacimiento.getMonth() ||
    (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate())
  ) {
    edad.anios--;
  }

  edad.meses = hoy.getMonth() - fechaNacimiento.getMonth();

  if (hoy.getDate() < fechaNacimiento.getDate()) {
    edad.meses--;
  }

  if (edad.meses < 0) {
    edad.meses += 12;
  }

  const diasEnMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();

  edad.dias = hoy.getDate() - fechaNacimiento.getDate();

  if (edad.dias < 0) {
    edad.dias += diasEnMesAnterior;
  }

  let resultado = [];

  if (edad.anios > 0) resultado.push(edad.anios + (edad.anios === 1 ? " año" : " años"));
  if (edad.meses > 0) resultado.push(edad.meses + (edad.meses === 1 ? " mes" : " meses"));
  if (edad.dias > 0 && edad.anios === 0 && edad.meses < 1) {
    resultado.push(edad.dias + (edad.dias === 1 ? " día" : " días"));
  }

  if (edad.anios === 0 && edad.meses === 0 && edad.dias > 0) {
    return edad.dias + (edad.dias === 1 ? " día" : " días");
  }

  return resultado.join(" y ");
}

function actualizarEdad() {
  const edad = calcularEdad();
  document.getElementById("edadResultado").value = edad;
}


function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}
