// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyBuXUkKafWADBz-ljYIKb59maZE4RYaLDw",
  authDomain: "convivir-para-aprender.firebaseapp.com",
  databaseURL: "https://convivir-para-aprender-default-rtdb.firebaseio.com/",
  projectId: "convivir-para-aprender"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== LOGIN =====

function registrar() {
    let user = document.getElementById("user").value;
    let pass = document.getElementById("pass").value;

    if (!user || !pass) {
        alert("Completa todos los campos");
        return;
    }

    db.ref("usuarios/" + user).set({
        password: pass,
        rol: "profesor"
    });

    alert("Profesor registrado en Convivir Para Aprender");
}

function entrar() {
    let rol = document.getElementById("rol").value;
    let userInput = document.getElementById("user").value;
    let passInput = document.getElementById("pass").value;

    if (rol === "profesor") {
        let p = JSON.parse(localStorage.getItem("profe"));

        if (!p) {
            localStorage.setItem("profe", JSON.stringify({
                user: userInput,
                pass: passInput
            }));
        }

        if (p && p.user !== userInput) {
            alert("Usuario incorrecto");
            return;
        }

        if (p && p.pass !== passInput) {
            alert("Contraseña incorrecta");
            return;
        }

        localStorage.setItem("rol", "profesor");

        document.getElementById("login").style.display = "none";
        document.getElementById("panelProfe").style.display = "block";
    }

    if (rol === "estudiante") {
        localStorage.setItem("rol", "estudiante");

        document.getElementById("login").style.display = "none";
        document.getElementById("panelEst").style.display = "block";
    }
}

// AUTO LOGIN
window.onload = () => {
    let rol = localStorage.getItem("rol");

    if (rol === "profesor") {
        login.style.display = "none";
        panelProfe.style.display = "block";
    }

    if (rol === "estudiante") {
        login.style.display = "none";
        panelEst.style.display = "block";
    }
};

// ===== JUEGO =====
let codigoActual = "";

function crearJuego() {
    codigoActual = Math.floor(Math.random() * 10000).toString();

    db.ref("juegos/" + codigoActual).set({
        estado: "esperando",
        preguntas: [],
        index: 0,
        jugadores: {}
    });

    document.getElementById("codigo").innerText = "Código: " + codigoActual;

    escucharJugadores();
}

// JUGADORES EN VIVO
function escucharJugadores() {
    db.ref("juegos/" + codigoActual + "/jugadores").on("value", snap => {
        let jugadores = snap.val() || {};
        let lista = document.getElementById("listaJugadores");

        lista.innerHTML = "";

        Object.keys(jugadores).forEach(nombre => {
            lista.innerHTML += `<li>${nombre} - ${jugadores[nombre].puntaje} pts</li>`;
        });
    });
}

// AGREGAR PREGUNTA
function agregarPregunta() {
    let ref = db.ref("juegos/" + codigoActual + "/preguntas");

    ref.once("value", snap => {
        let data = snap.val() || [];

        data.push({
            texto: pregunta.value,
            correcta: correcta.value,
            tipo: tipo.value,
            tiempo: parseInt(document.getElementById("tiempo").value),
            opciones: opciones.value.split(",")
        });

        ref.set(data);
    });

    alert("Pregunta agregada");
}

// INICIAR
function iniciarJuego() {
    db.ref("juegos/" + codigoActual + "/estado").set("jugando");
}

// SIGUIENTE
function siguientePregunta() {
    let ref = db.ref("juegos/" + codigoActual);

    ref.once("value", snap => {
        let juego = snap.val();
        db.ref("juegos/" + codigoActual + "/index").set(juego.index + 1);
    });
}

// ===== ESTUDIANTE =====
let jugador = "";
let codigoJuego = "";

function unirse() {
    jugador = document.getElementById("nombre").value;
    codigoJuego = document.getElementById("codigoEst").value;

    let ref = db.ref("juegos/" + codigoJuego);

    ref.once("value", snap => {
        if (!snap.exists()) {
            alert("El juego no existe");
            return;
        }

        db.ref("juegos/" + codigoJuego + "/jugadores/" + jugador).set({
            puntaje: 0
        });

        escucharJuego();
    });
}

// ESCUCHAR
function escucharJuego() {
    db.ref("juegos/" + codigoJuego).on("value", snap => {
        let juego = snap.val();
        if (!juego) return;

        if (juego.estado === "jugando") {
            mostrarPregunta(juego);
        }
    });
}

// MOSTRAR
function mostrarPregunta(juego) {
    let p = juego.preguntas[juego.index];

    if (!p) {
        document.getElementById("juego").innerHTML = "<h2>🎉 Juego terminado</h2>";
        return;
    }

    let html = `<h2>${p.texto}</h2><p id="tiempoTexto"></p>`;

    if (p.tipo === "quiz") {
        p.opciones.forEach(op => {
            html += `<button onclick="responder('${op}')">${op}</button>`;
        });
    }

    if (p.tipo === "vf") {
        html += `<button onclick="responder('verdadero')">Verdadero</button>`;
        html += `<button onclick="responder('falso')">Falso</button>`;
    }

    if (p.tipo === "carta") {
        for (let i = 1; i <= 4; i++) {
            html += `<button onclick="responder('${i}')">🃏 Carta ${i}</button>`;
        }
    }

    document.getElementById("juego").innerHTML = html;

    let tiempoRestante = p.tiempo || 10;

    let timer = setInterval(() => {
        let t = document.getElementById("tiempoTexto");
        if (t) t.innerText = "Tiempo: " + tiempoRestante;

        tiempoRestante--;

        if (tiempoRestante < 0) clearInterval(timer);
    }, 1000);
}

// RESPONDER
function responder(resp) {
    let ref = db.ref("juegos/" + codigoJuego);

    ref.once("value", snap => {
        let juego = snap.val();
        let p = juego.preguntas[juego.index];

        if (resp.toLowerCase() === p.correcta.toLowerCase()) {
            let puntRef = db.ref("juegos/" + codigoJuego + "/jugadores/" + jugador + "/puntaje");

            puntRef.once("value", s => {
                let nuevo = (s.val() || 0) + 10;
                puntRef.set(nuevo);
                document.getElementById("puntaje").innerText = "Puntaje: " + nuevo;
            });
        }
    });
}
