// ===== CONFIG FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyBuXUkKafWADBz-ljYIKb59maZE4RYaLDw",
  authDomain: "convivir-para-aprender.firebaseapp.com",
  databaseURL: "https://convivir-para-aprender-default-rtdb.firebaseio.com/",
  projectId: "convivir-para-aprender"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== PROFESOR =====
function registrar() {
    localStorage.setItem("profe", JSON.stringify({
        user: user.value,
        pass: pass.value
    }));
    alert("Profesor registrado");
}

function login() {
    let p = JSON.parse(localStorage.getItem("profe"));
    if (p && p.user === user.value && p.pass === pass.value) {
        panelProfe.style.display = "block";
    } else {
        alert("Datos incorrectos");
    }
}

// ===== CREAR JUEGO =====
let codigoActual = "";

function crearJuego() {
    codigoActual = Math.floor(Math.random() * 10000).toString();

    db.ref("juegos/" + codigoActual).set({
        estado: "esperando",
        preguntas: [],
        index: 0
    });

    codigo.innerText = "Código del juego: " + codigoActual;
}

// ===== AGREGAR PREGUNTA =====
function agregarPregunta() {
    let ref = db.ref("juegos/" + codigoActual + "/preguntas");

    ref.once("value", snap => {
        let data = snap.val() || [];

        data.push({
            texto: pregunta.value,
            correcta: correcta.value,
            tipo: tipo.value,
            opciones: opciones.value.split(",")
        });

        ref.set(data);
    });

    alert("Pregunta agregada");
}

// ===== INICIAR JUEGO =====
function iniciarJuego() {
    db.ref("juegos/" + codigoActual + "/estado").set("jugando");
}

// ===== ESTUDIANTE =====
let jugador = "";
let codigoJuego = "";

function unirse() {
    jugador = nombre.value;
    codigoJuego = codigoEst.value;

    db.ref("juegos/" + codigoJuego + "/jugadores/" + jugador).set({
        puntaje: 0
    });

    escucharJuego();
}

// ===== ESCUCHAR CAMBIOS =====
function escucharJuego() {
    db.ref("juegos/" + codigoJuego).on("value", snap => {
        let juego = snap.val();
        if (!juego) return;

        if (juego.estado === "jugando") {
            mostrarPregunta(juego);
        }
    });
}

// ===== MOSTRAR PREGUNTA =====
function mostrarPregunta(juego) {
    let p = juego.preguntas[juego.index];
    if (!p) {
        juegoDiv.innerHTML = "<h2>🎉 Juego terminado</h2>";
        return;
    }

    let html = `<h2>${p.texto}</h2>`;

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
}

// ===== RESPONDER =====
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

        db.ref("juegos/" + codigoJuego + "/index").set(juego.index + 1);
    });
}