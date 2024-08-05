let letras = []; // Arreglo de letras de la palabra a adivinar
let intentos = 1; // Número de intentos restantes
let letrasUsadas = []; // Arreglo de letras ya ingresadas
let letrasFaltantes = 0; // Número de letras faltantes para adivinar la palabra
let puntaje = 0; // Puntaje del jugador
let tiempoInicio; // Tiempo de inicio del juego
let tiempoObjetivo = 60; // Tiempo objetivo para adivinar la palabra
let keydownHandler = null; // Función que maneja el evento keydown

// Obtiene una palabra aleatoria de la API de palabras aleatorias.
async function obtenerPalabraAleatoria() {
    const respuesta = await fetch('https://random-word-api.herokuapp.com/word?lang=es');
    const palabra = await respuesta.json();
    return palabra[0];
}

// Funcion para comenzar el juego
async function comenzarJuego() {
    tiempoInicio = new Date(); // Iniciar el tiempo al comenzar el juego
    const palabra = await obtenerPalabraAleatoria();
    nuevaPalabra(palabra);
    if (keydownHandler) {
        document.removeEventListener("keydown", keydownHandler);
    }
    keydownHandler = (e) => {
        let letra = e.key.toUpperCase();
        let letraValida = /^[A-ZÁ-Ú]$/;
        if (letra.match(letraValida)) {
            letraIngresada(letra);
        }
    };
    document.addEventListener("keydown", keydownHandler);
    cargarPuntuaciones(); // Cargar las puntuaciones al comenzar el juego
}

// Nueva palabra para adivinar.
function nuevaPalabra(cadena) {
    letras = Array.from(cadena);
    letrasFaltantes = letras.filter(letra => letra !== " ").length;
    let contenedor = document.getElementsByClassName("contenedor-palabra");
    letras.forEach(letra => {
        let casilla = document.createElement("div");
        casilla.className = letra === " " ? "palabra espacio" : "palabra letra";
        contenedor[0].appendChild(casilla);
    });
}

// verifica la letra ingresada por el usuario
function letraIngresada(letra) {
    if (letrasUsadas.includes(letra)) {
        alert("Esa letra ya la usaste");
    } else {
        letrasUsadas.push(letra);
        if (incluyeLetra(letra)) {
            letraCorrecta(letra);
        } else {
            letraIncorrecta();
        }
    }
}

// Verifica si la letra esta en la palabra
function incluyeLetra(letra) {
    return letras.some(l => l.toUpperCase() === letra);
}

// Obtiene los índices de las ocurrencias de una letra en la palabra
function getIndices(letra) {
    return letras
        .map((l, i) => l.toUpperCase() === letra ? i : -1)
        .filter(i => i !== -1);
}

// verifica letra correcta ingresada
function letraCorrecta(letra) {
    let indices = getIndices(letra);
    letrasFaltantes -= indices.length;
    let casillas = document.getElementsByClassName("palabra");
    indices.forEach(index => {
        let casilla = casillas[index];
        casilla.textContent = letras[index];
    });
    if (letrasFaltantes === 0) ganar();
}

// verifica letra incorrecta ingresada
function letraIncorrecta() {
    intentos++;
    let imagenString = "img/" + intentos + ".png";
    document.getElementById("imagen").src = imagenString;
    if (intentos === 7) perder();
}

// función en caso de ganar
function ganar() {
    // Calcular el tiempo transcurrido
    let tiempoFin = new Date();
    let tiempoTranscurrido = (tiempoFin - tiempoInicio) / 1000; // Convertir a segundos
    // Calcular la puntuación
    let puntosBase = 100;
    let penalizacionTiempo = Math.max(0, tiempoTranscurrido - tiempoObjetivo) * -1;
    let penalizacionErrores = (intentos - 1) * -10; // Restar 1 porque el primer intento no cuenta como error
    puntaje = puntosBase + penalizacionTiempo + penalizacionErrores;
    let score = document.getElementsByClassName("contenedor-puntaje")[0];
    if (score) {
        score.innerHTML = "Puntaje: " + puntaje;
    }
    let fin = document.createElement("h1");
    fin.id = "titulo";
    fin.innerHTML = "Ganaste";
    document.body.replaceChild(fin, document.getElementById("titulo"));
    // Esperar 5 segundos antes de solicitar el nombre
    setTimeout(() => {
        let nombre = prompt("Ingresa tu nombre para guardar tu puntuación:");
        if (nombre) {
            guardarPuntuacion(nombre, tiempoTranscurrido, puntaje);
            crearBoton(); // Crear botón para volver a jugar
        } else {
            alert("Por favor, ingresa tu nombre.");
        }
    }, 5000);
}

// función al perder el juego
function perder() {
    let fin = document.createElement("h1");
    fin.id = "titulo";
    fin.innerHTML = "Perdiste";
    document.body.replaceChild(fin, document.getElementById("titulo"));
    let casillas = document.getElementsByClassName("palabra");
    letras.forEach((letra, i) => {
        if (casillas[i].textContent === "") {
            casillas[i].classList.add("faltante");
            casillas[i].textContent = letra;
        }
    });
    crearBoton();
}

// Crea el botón para volver a jugar
function crearBoton() {
    let contenedor = document.getElementsByClassName("contenedor-letras")[0];
    let botonAnterior = contenedor.querySelector("button");
    if (botonAnterior) {
        contenedor.removeChild(botonAnterior);
    }
    let mensaje = contenedor.getElementsByTagName("h3")[0];
    if (mensaje) contenedor.removeChild(mensaje);
    let boton = document.createElement("button");
    boton.innerHTML = "Volver a jugar";
    boton.addEventListener("click", reiniciar);
    contenedor.appendChild(boton);
}

// Reinicia el juego al terminarlo
function reiniciar() {
    letras = [];
    intentos = 1;
    letrasUsadas = [];
    letrasFaltantes = 0;
    let contenedorPalabra = document.getElementsByClassName("contenedor-palabra")[0];
    contenedorPalabra.innerHTML = "";
    let imagenString = "img/1.png";
    document.getElementById("imagen").src = imagenString;
    let contenedorLetras = document.getElementsByClassName("contenedor-letras")[0];
    contenedorLetras.innerHTML = "";
    let mensaje = document.createElement("h1");
    mensaje.id = "titulo";
    mensaje.innerHTML = "Juego de Ahorcado";
    document.body.replaceChild(mensaje, document.getElementById("titulo"));
    let input = document.getElementById("entrada-letra");
    if (input) input.remove();
    comenzarJuego();
}

// Guarda la puntuación en la base de datos
async function guardarPuntuacion(nombre, tiempo, puntos) {
    try {
        let response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                puntos: puntos,
                tiempo: tiempo,
                fecha: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Error al guardar la puntuación');
        }

        alert('Puntuación guardada con éxito');
        cargarPuntuaciones(); // Cargar la tabla de puntuaciones después de guardar
    } catch (error) {
        console.error('Error al guardar la puntuación:', error);
        alert('Error al guardar la puntuación');
    }
}

// Carga las puntuaciones desde la base de datos
async function cargarPuntuaciones() {
    const response = await fetch('http://localhost:3000/api/scores');
    if (response.ok) {
        const scores = await response.json();
        mostrarPuntuaciones(scores);
    } else {
        console.error('Error al cargar las puntuaciones');
    }
}

function mostrarPuntuaciones(scores) {
    let contenedorTabla = document.getElementsByClassName("contenedor-tabla")[0];
    contenedorTabla.innerHTML = ""; // Limpiar cualquier contenido anterior
    let tabla = document.createElement("table");
    let thead = document.createElement("thead");
    let tbody = document.createElement("tbody");
    // Encabezados de la tabla
    let encabezados = ["Nombre", "Tiempo (segundos)", "Puntos", "Fecha"];
    let tr = document.createElement("tr");
    encabezados.forEach(encabezado => {
        let th = document.createElement("th");
        th.textContent = encabezado;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    // Filas de la tabla con las puntuaciones
    scores.forEach(score => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${score.nombre}</td>
            <td>${score.tiempo}</td>
            <td>${score.puntos}</td>
            <td>${score.fecha}</td>
        `;
        tbody.appendChild(tr);
    });
    tabla.appendChild(thead);
    tabla.appendChild(tbody);
    contenedorTabla.appendChild(tabla);
}

comenzarJuego();
