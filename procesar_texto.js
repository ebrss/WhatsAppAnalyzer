let conteoPalabrasGlobal = {};
let conteoPalabrasPersona = {};
let conteoPersonas = {};
let totalPalabrasPersona = {};
let totalMensajesPersona = {};

function analizarArchivo(event) { 
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const texto = e.target.result;
        procesarTextoFase1(texto);
        procesarTextoFase2();
    };
    reader.readAsText(archivo);
}

function procesarTextoFase1(texto) {
    const patron = /(\d{2}\/\d{2}\/\d{4}), (\d{1,2}:\d{2}\s?(?:am|pm)) - (.*?): (.+)/g;
    let id = 1;
    let coincidencia;

    conteoPalabrasGlobal = {};
    conteoPalabrasPersona = {};
    conteoPersonas = {};
    totalPalabrasPersona = {};
    totalMensajesPersona = {};

    while ((coincidencia = patron.exec(texto)) !== null) {
        let [_, fecha, hora, persona, mensaje] = coincidencia;
        if (mensaje.toLowerCase().includes("media")) continue;
        if (mensaje.toLowerCase().includes("null")) continue;

        let palabras = mensaje.toLowerCase().split(/\s+/).map(word => word.replace(/[^a-zA-Záéíóúüñ]/g, ""));
        let palabrasValidas = palabras.filter(palabra => palabra);
        if (palabrasValidas.length === 0) continue;

        conteoPersonas[persona] = (conteoPersonas[persona] || 0) + 1;
        totalMensajesPersona[persona] = (totalMensajesPersona[persona] || 0) + 1;
        totalPalabrasPersona[persona] = (totalPalabrasPersona[persona] || 0) + palabrasValidas.length;

        palabrasValidas.forEach(palabra => {
            conteoPalabrasPersona[persona] = conteoPalabrasPersona[persona] || {};
            conteoPalabrasPersona[persona][palabra] = (conteoPalabrasPersona[persona][palabra] || 0) + 1;
            conteoPalabrasGlobal[palabra] = (conteoPalabrasGlobal[palabra] || 0) + 1;
        });
    }

    mostrarResultados();
}

function procesarTextoFase2() {
    let palabrasComunesActivas = obtenerPalabrasComunesActivas();

    let conteoPalabrasGlobalFiltrado = {};
    for (let palabra in conteoPalabrasGlobal) {
        if (!palabrasComunesActivas.has(palabra)) {
            conteoPalabrasGlobalFiltrado[palabra] = conteoPalabrasGlobal[palabra];
        }
    }

    actualizarPalabras(conteoPalabrasGlobalFiltrado, conteoPalabrasPersona, palabrasComunesActivas);
}

function actualizarPalabras(conteoPalabrasGlobalFiltrado, conteoPalabrasPersona, palabrasComunesActivas) {
    let cantidadGlobal = document.getElementById("sliderGlobal").value;
    let cantidadPersona = document.getElementById("sliderPersona").value;

    // Mostrar el top global de palabras
    let palabrasGlobales = "<h3>Palabras más usadas globalmente</h3><ul>";
    let topPalabras = Object.entries(conteoPalabrasGlobalFiltrado)
        .sort((a, b) => b[1] - a[1])
        .slice(0, cantidadGlobal);
    topPalabras.forEach(([palabra, frecuencia]) => {
        palabrasGlobales += `<li>${palabra}: ${frecuencia} veces</li>`;
    });
    palabrasGlobales += "</ul>";
    document.getElementById("palabrasGlobales").innerHTML = palabrasGlobales;

    // Mostrar las palabras más usadas por persona, filtradas
    let palabrasPorPersona = "<h3>Palabras más usadas por Persona</h3>";
    for (let persona in conteoPalabrasPersona) {
        let palabrasFiltradas = {};
        for (let palabra in conteoPalabrasPersona[persona]) {
            if (!palabrasComunesActivas.has(palabra)) {
                palabrasFiltradas[palabra] = conteoPalabrasPersona[persona][palabra];
            }
        }
        palabrasPorPersona += `<h4>${persona}</h4><ul>`;
        let palabras = Object.entries(palabrasFiltradas)
            .sort((a, b) => b[1] - a[1])
            .slice(0, cantidadPersona);
        palabras.forEach(([palabra, frecuencia]) => {
            palabrasPorPersona += `<li>${palabra}: ${frecuencia} veces</li>`;
        });
        palabrasPorPersona += "</ul>";
    }
    document.getElementById("palabrasPorPersona").innerHTML = palabrasPorPersona;
}

function obtenerPalabrasComunesActivas() {
    let palabrasComunesActivas = new Set();
    const checkboxes = document.querySelectorAll('#categorias input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        if (palabrasComunes[checkbox.id]) {
            palabrasComunesActivas = new Set([...palabrasComunesActivas, ...palabrasComunes[checkbox.id]]);
        }
    });
    return palabrasComunesActivas;
}


function mostrarResultados() {
    let resultados = document.getElementById("resultados");
    resultados.innerHTML = "";

    let msgPorPersona = "<h3>Mensajes por Persona</h3><ul>";
    for (let persona in conteoPersonas) {
        let promedio = totalMensajesPersona[persona] > 0 ? (totalPalabrasPersona[persona] / totalMensajesPersona[persona]).toFixed(2) : 0;
        msgPorPersona += `<li>${persona}: ${conteoPersonas[persona]} mensajes, ${totalPalabrasPersona[persona]} palabras, Promedio: ${promedio} palabras/mensaje</li>`;
    }
    msgPorPersona += "</ul>";
    resultados.innerHTML += msgPorPersona;
}

// Inicializar el evento de archivo
document.getElementById('fileInput').addEventListener('change', analizarArchivo);

// Añadir los listeners para los checkboxes y sliders
function agregarListeners() {
    const checkboxes = document.querySelectorAll('#categorias input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            procesarTextoFase2();  // Recalcular cuando cambian los checkboxes
        });
    });

    // Detectar cambios en los deslizadores
    document.getElementById("sliderGlobal").addEventListener('input', function() {
        document.getElementById("inputGlobal").value = this.value; // Sincronizar slider y input
        procesarTextoFase2();  // Recalcular cuando cambia el slider de palabras globales
        document.getElementById("valorGlobal").innerText = this.value;
    });

    document.getElementById("sliderPersona").addEventListener('input', function() {
        document.getElementById("inputPersona").value = this.value; // Sincronizar slider y input
        procesarTextoFase2();  // Recalcular cuando cambia el slider de palabras por persona
        document.getElementById("valorPersona").innerText = this.value;
    });

    // Sincronizar los inputs con los sliders
    document.getElementById("inputGlobal").addEventListener('input', function() {
        document.getElementById("sliderGlobal").value = this.value;
        procesarTextoFase2(); // Recalcular cuando cambia el input
        document.getElementById("valorGlobal").innerText = this.value;
    });

    document.getElementById("inputPersona").addEventListener('input', function() {
        document.getElementById("sliderPersona").value = this.value;
        procesarTextoFase2(); // Recalcular cuando cambia el input
        document.getElementById("valorPersona").innerText = this.value;
    });
}

document.addEventListener('DOMContentLoaded', agregarListeners);
