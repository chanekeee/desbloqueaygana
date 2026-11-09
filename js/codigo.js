(() => {
  "use strict";

  const lienzo = document.getElementById("lienzoJuego");
  const contexto = lienzo.getContext("2d");
  const textoPuntos = document.getElementById("puntos");
  const textoVidas = document.getElementById("vidas");
  const textoBarricadas = document.getElementById("barricadas");
  const textoTiempo = document.getElementById("tiempo");
  const pantallaAviso = document.getElementById("pantallaAviso");
  const tituloAviso = document.getElementById("tituloAviso");
  const textoAviso = document.getElementById("textoAviso");
  const avisoSuperior = document.getElementById("avisoSuperior");
  const botonPrincipalJuego = document.getElementById("botonPrincipalJuego");
  const botonPausa = document.getElementById("botonPausa");
  const botonReiniciar = document.getElementById("botonReiniciar");
  const avisoPausaJuego = document.getElementById("avisoPausaJuego");

  const ANCHO = lienzo.width;
  const ALTO = lienzo.height;
  const TOTAL_BARRICADAS = 8;
  const teclas = new Set();
  let estadoJuego = "menu";
  let puntos = 0;
  let vidas = 3;
  let tiempoRestante = 60;
  let barricadasRotas = 0;
  let ultimoFotograma = 0;
  let temporizadorAparicion = 0;
  let temporizadorProteccion = 0;
  let jugador;
  let bloqueadores = [];
  let barricadas = [];
  let piedrasLanzadas = [];

  // Utilidad para números aleatorios dentro de un rango.
  const aleatorio = (min, max) => Math.random() * (max - min) + min;
  const limitar = (value, min, max) => Math.max(min, Math.min(max, value));

  class Jugador {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.radio = 18;
      this.velocidad = 235;
      this.direccion = { x: 0, y: -1 };
      this.esperaLanzamiento = 0;
    }
    mover(dt) {
      let dx = 0, dy = 0;
      if (teclas.has("ArrowLeft") || teclas.has("a")) dx -= 1;
      if (teclas.has("ArrowRight") || teclas.has("d")) dx += 1;
      if (teclas.has("ArrowUp") || teclas.has("w")) dy -= 1;
      if (teclas.has("ArrowDown") || teclas.has("s")) dy += 1;
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        dx /= length; dy /= length;
        this.direccion = { x: dx, y: dy };
        this.x += dx * this.velocidad * dt;
        this.y += dy * this.velocidad * dt;
      }
      this.x = limitar(this.x, 28, ANCHO - 28);
      this.y = limitar(this.y, 35, ALTO - 28);
      this.esperaLanzamiento = Math.max(0, this.esperaLanzamiento - dt);
    }
    dibujar() {
      contexto.save();
      contexto.translate(this.x, this.y);
      if (temporizadorProteccion > 0 && Math.floor(temporizadorProteccion * 12) % 2 === 0) contexto.globalAlpha = 0.45;
      // Sombra
      contexto.fillStyle = "#11182755"; contexto.beginPath(); contexto.ellipse(2, 13, 17, 7, 0, 0, Math.PI * 2); contexto.fill();
      // Cuerpo caricaturesco: chaqueta azul y cabeza.
      contexto.fillStyle = "#2c6ac7"; contexto.beginPath(); contexto.roundRect(-13, -2, 26, 25, 7); contexto.fill();
      contexto.fillStyle = "#f3c7a1"; contexto.beginPath(); contexto.arc(0, -12, 12, 0, Math.PI * 2); contexto.fill();
      contexto.fillStyle = "#39291f"; contexto.beginPath(); contexto.arc(0, -17, 12, Math.PI, Math.PI * 2); contexto.fill();
      contexto.fillStyle = "#fff"; contexto.beginPath(); contexto.arc(-4, -12, 2.5, 0, Math.PI * 2); contexto.arc(4, -12, 2.5, 0, Math.PI * 2); contexto.fill();
      contexto.fillStyle = "#26364b"; contexto.beginPath(); contexto.arc(-4, -12, 1, 0, Math.PI * 2); contexto.arc(4, -12, 1, 0, Math.PI * 2); contexto.fill();
      contexto.strokeStyle = "#6e4033"; contexto.lineWidth = 2; contexto.beginPath(); contexto.moveTo(-3, -6); contexto.lineTo(3, -6); contexto.stroke();
      // Pequeña insignia tricolor ficticia.
      contexto.fillStyle = "#df4545"; contexto.fillRect(-5, 4, 10, 3);
      contexto.fillStyle = "#f2cf4a"; contexto.fillRect(-5, 7, 10, 3);
      contexto.fillStyle = "#45a96b"; contexto.fillRect(-5, 10, 10, 3);
      contexto.restore();
    }
  }

  class Bloqueador {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.radio = 18;
      this.velocidad = aleatorio(38, 72);
      this.fase = aleatorio(0, Math.PI * 2);
      this.direccion = Math.random() < 0.5 ? -1 : 1;
    }
    actualizar(dt) {
      this.fase += dt * 2;
      this.x += Math.sin(this.fase) * this.velocidad * dt * this.direccion;
      this.y += Math.cos(this.fase * 0.7) * this.velocidad * 0.22 * dt;
      this.x = limitar(this.x, 35, ANCHO - 35);
      this.y = limitar(this.y, 55, ALTO - 35);
    }
    dibujar() {
      contexto.save(); contexto.translate(this.x, this.y);
      contexto.fillStyle = "#0005"; contexto.beginPath(); contexto.ellipse(2, 13, 18, 7, 0, 0, Math.PI * 2); contexto.fill();
      // Poncho rojo con franjas tejidas y sombrero caricaturesco.
      contexto.fillStyle = "#8f2828"; contexto.beginPath(); contexto.moveTo(-13,-3); contexto.lineTo(-18,17); contexto.lineTo(0,23); contexto.lineTo(18,17); contexto.lineTo(13,-3); contexto.closePath(); contexto.fill();
      contexto.fillStyle = "#d74b3f"; contexto.beginPath(); contexto.moveTo(-10,0); contexto.lineTo(-13,15); contexto.lineTo(0,19); contexto.lineTo(13,15); contexto.lineTo(10,0); contexto.closePath(); contexto.fill();
      contexto.fillStyle = "#f0c45f"; contexto.fillRect(-12,7,24,3);
      contexto.fillStyle = "#3e7181"; contexto.fillRect(-10,12,20,2);
      contexto.fillStyle = "#e9b58d"; contexto.beginPath(); contexto.arc(0,-11,10,0,Math.PI*2); contexto.fill();
      contexto.fillStyle = "#8c3d25"; contexto.beginPath(); contexto.ellipse(0,-17,17,5,0,Math.PI,Math.PI*2); contexto.fill();
      contexto.fillStyle = "#c56b36"; contexto.fillRect(-11,-19,22,3);
      contexto.fillStyle = "#fff"; contexto.beginPath(); contexto.arc(-4,-11,2,0,Math.PI*2); contexto.arc(4,-11,2,0,Math.PI*2); contexto.fill();
      contexto.fillStyle = "#4a3028"; contexto.beginPath(); contexto.arc(-4,-11,1,0,Math.PI*2); contexto.arc(4,-11,1,0,Math.PI*2); contexto.fill();
      contexto.strokeStyle = "#7d342d"; contexto.lineWidth = 2; contexto.beginPath(); contexto.moveTo(-4,-5); contexto.lineTo(4,-5); contexto.stroke();
      contexto.restore();
    }
  }

  class Barricada {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.width = aleatorio(48, 66); this.height = aleatorio(34, 43);
      this.resistencia = 1;
      this.activo = true;
      this.tipo = Math.random() < 0.5 ? "llantas" : "piedras";
    }
    dibujar() {
      if (!this.activo) return;
      contexto.save(); contexto.translate(this.x, this.y);
      if (this.tipo === "llantas") {
        for (let i = 0; i < 3; i++) {
          contexto.fillStyle = "#242b35"; contexto.beginPath(); contexto.ellipse(-17 + i * 17, 2 + (i % 2) * 5, 14, 11, 0, 0, Math.PI * 2); contexto.fill();
          contexto.strokeStyle = "#68707c"; contexto.lineWidth = 3; contexto.beginPath(); contexto.ellipse(-17 + i * 17, 2 + (i % 2) * 5, 6, 4, 0, 0, Math.PI * 2); contexto.stroke();
        }
      } else {
        const rocks = [[-20,4,14],[0,-4,17],[19,5,13],[-5,12,12]];
        rocks.forEach(([x,y,r],i) => {
          contexto.fillStyle = ["#8b8276","#a59b8a","#716d69","#b3a38c"][i];
          contexto.beginPath(); contexto.moveTo(x-r,y); contexto.lineTo(x-r/2,y-r*.8); contexto.lineTo(x+r*.5,y-r); contexto.lineTo(x+r,y); contexto.lineTo(x+r*.4,y+r*.6); contexto.lineTo(x-r*.6,y+r*.5); contexto.closePath(); contexto.fill();
          contexto.strokeStyle = "#5c5b59"; contexto.lineWidth = 1.5; contexto.stroke();
        });
      }
      contexto.restore();
    }
  }

  class Piedra {
    constructor(x, y, dx, dy) {
      this.x = x; this.y = y; this.dx = dx; this.dy = dy;
      this.velocidad = 390; this.duracion = 0.55; this.radio = 6;
    }
    actualizar(dt) {
      this.x += this.dx * this.velocidad * dt;
      this.y += this.dy * this.velocidad * dt;
      this.duracion -= dt;
    }
    dibujar() {
      contexto.fillStyle = "#d6c7a5"; contexto.strokeStyle = "#665d4e"; contexto.lineWidth = 2;
      contexto.beginPath(); contexto.arc(this.x, this.y, this.radio, 0, Math.PI * 2); contexto.fill(); contexto.stroke();
      contexto.fillStyle = "#fff8"; contexto.beginPath(); contexto.arc(this.x - 2, this.y - 2, 1.8, 0, Math.PI * 2); contexto.fill();
    }
  }

  function dibujarEscenario() {
    // La carretera ocupa todo el escenario, sin edificios ni elementos decorativos.
    contexto.fillStyle = "#737d88";
    contexto.fillRect(0, 0, ANCHO, ALTO);

    // Líneas laterales de la calzada.
    contexto.fillStyle = "#c5cbd0";
    contexto.fillRect(18, 0, 5, ALTO);
    contexto.fillRect(ANCHO - 23, 0, 5, ALTO);

    // Línea central discontinua.
    contexto.fillStyle = "#e8d68a";
    for (let y = 12; y < ALTO; y += 72) {
      contexto.fillRect(ANCHO / 2 - 3, y, 6, 34);
    }
  }

  function lanzarPiedra() {
    if (estadoJuego !== "playing" || !jugador || jugador.esperaLanzamiento > 0) return;
    jugador.esperaLanzamiento = 0.38;
    const d = jugador.direccion;
    piedrasLanzadas.push(new Piedra(jugador.x + d.x*22, jugador.y + d.y*22, d.x, d.y));
  }

  function reiniciarEstado() {
    puntos = 0; vidas = 3; tiempoRestante = 60; barricadasRotas = 0;
    jugador = new Jugador(ANCHO/2, ALTO/2);
    bloqueadores = [];
    barricadas = [];
    piedrasLanzadas = [];
    temporizadorAparicion = 0;
    temporizadorProteccion = 0;
    // Barricadas en posiciones iniciales sin bloquear el punto de aparición.
    const spots = [[150,160],[320,135],[520,170],[790,160],[175,430],[390,470],[620,420],[805,455]];
    spots.forEach(([x,y]) => barricadas.push(new Barricada(x,y)));
    for (let i=0;i<5;i++) bloqueadores.push(new Bloqueador(aleatorio(70,ANCHO-70), aleatorio(100,ALTO-100)));
    actualizarIndicadores();
  }

  function actualizarIndicadores() {
    textoPuntos.textContent = String(puntos).padStart(4, "0");
    textoVidas.textContent = "♥ ".repeat(vidas).trim() || "—";
    textoBarricadas.textContent = `${barricadasRotas} / ${TOTAL_BARRICADAS}`;
    textoTiempo.textContent = Math.ceil(tiempoRestante);
  }

  function mostrarAviso(tipo, titulo, texto, boton) {
    pantallaAviso.hidden = false;
    avisoSuperior.textContent = tipo;
    tituloAviso.textContent = titulo;
    textoAviso.textContent = texto;
    botonPrincipalJuego.textContent = boton;
  }

  function iniciarJuego() {
    reiniciarEstado();
    estadoJuego = "playing";
    pantallaAviso.hidden = true;
    avisoPausaJuego.hidden = true;
    botonPausa.disabled = false;
    botonPausa.textContent = "Pausar";
    ultimoFotograma = performance.now();
  }

  function alternarPausa() {
    if (estadoJuego === "playing") {
      estadoJuego = "paused";
      avisoPausaJuego.hidden = false;
      botonPausa.textContent = "Continuar";
    } else if (estadoJuego === "paused") {
      estadoJuego = "playing";
      avisoPausaJuego.hidden = true;
      botonPausa.textContent = "Pausar";
      ultimoFotograma = performance.now();
    }
  }

  function terminarJuego(victoria) {
    estadoJuego = victoria ? "won" : "lost";
    botonPausa.disabled = true;
    avisoPausaJuego.hidden = true;
    const titulo = victoria ? "¡Ruta liberada!" : "¡El bloqueo continúa!";
    const texto = victoria
      ? `¡Bien hecho! Abriste paso y conseguiste ${puntos} puntos. La ciudad vuelve a circular.`
      : `La ruta sigue bloqueada. Conseguistе ${puntos} puntos y abriste ${barricadasRotas} de ${TOTAL_BARRICADAS} barricadas. ¡Prueba otra vez!`;
    mostrarAviso(victoria ? "VICTORIA" : "FIN DE PARTIDA", titulo, texto, "Jugar otra vez");
  }

  function hayChoqueCircular(a, b, extra=0) {
    return Math.hypot(a.x-b.x, a.y-b.y) < a.radio + b.radio + extra;
  }

  function actualizar(dt) {
    if (estadoJuego !== "playing") return;
    tiempoRestante -= dt;
    if (tiempoRestante <= 0) { tiempoRestante = 0; actualizarIndicadores(); terminarJuego(barricadasRotas >= TOTAL_BARRICADAS); return; }
    jugador.mover(dt);
    temporizadorProteccion = Math.max(0, temporizadorProteccion - dt);

    bloqueadores.forEach(b => b.actualizar(dt));
    piedrasLanzadas.forEach(s => s.actualizar(dt));
    piedrasLanzadas = piedrasLanzadas.filter(s => s.duracion > 0 && s.x > 0 && s.x < ANCHO && s.y > 0 && s.y < ALTO);

    // Las piedras solo interactúan con barricadas: el humor se centra en despejar el camino.
    piedrasLanzadas.forEach(stone => {
      barricadas.forEach(barrier => {
        if (!barrier.activo) return;
        const hit = Math.abs(stone.x - barrier.x) < barrier.width/2 + 7 &&
                    Math.abs(stone.y - barrier.y) < barrier.height/2 + 7;
        if (hit) {
          barrier.activo = false;
          stone.duracion = 0;
          barricadasRotas++;
          puntos += 100;
        }
      });
    });

    // Los personajes bloqueadores son obstáculos móviles; el contacto resta una vida, sin daño gráfico.
    bloqueadores.forEach(b => {
      if (temporizadorProteccion <= 0 && hayChoqueCircular(jugador, b, -7)) {
        vidas--;
        temporizadorProteccion = 1.25;
        puntos = Math.max(0, puntos - 25);
        if (vidas <= 0) { actualizarIndicadores(); terminarJuego(false); }
      }
    });

    temporizadorAparicion += dt;
    if (temporizadorAparicion > 7 && bloqueadores.length < 8) {
      bloqueadores.push(new Bloqueador(aleatorio(60,ANCHO-60), aleatorio(95,ALTO-95)));
      temporizadorAparicion = 0;
    }

    if (barricadasRotas >= TOTAL_BARRICADAS) { actualizarIndicadores(); terminarJuego(true); }
    actualizarIndicadores();
  }

  function dibujar() {
    dibujarEscenario();
    barricadas.forEach(b => b.dibujar());
    bloqueadores.forEach(b => b.dibujar());
    piedrasLanzadas.forEach(s => s.dibujar());
    if (jugador) jugador.dibujar();
    if (estadoJuego === "menu") {
      contexto.fillStyle = "#11182755"; contexto.fillRect(0,0,ANCHO,ALTO);
      contexto.fillStyle = "#fff"; contexto.textAlign = "center";
      contexto.font = "900 43px Inter, sans-serif"; contexto.fillText("BLOQUEO SURVIVOR", ANCHO/2, ALTO/2-25);
      contexto.font = "600 17px Inter, sans-serif"; contexto.fillText("Sátira boliviana · La ruta está bloqueada", ANCHO/2, ALTO/2+12);
      contexto.textAlign = "start";
    }
  }

  function loop(timestamp) {
    const dt = Math.min((timestamp - ultimoFotograma) / 1000 || 0, 0.035);
    ultimoFotograma = timestamp;
    actualizar(dt);
    dibujar();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(event.key)) event.preventDefault();
    if (key === " " || event.code === "Space") { lanzarPiedra(); return; }
    if (key === "p") { alternarPausa(); return; }
    teclas.add(key);
  });
  window.addEventListener("keyup", event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    teclas.delete(key);
  });
  window.addEventListener("blur", () => teclas.clear());

  botonPrincipalJuego.addEventListener("click", iniciarJuego);
  botonPausa.addEventListener("click", alternarPausa);
  botonReiniciar.addEventListener("click", () => {
    iniciarJuego();
  });
  document.querySelectorAll("[data-key]").forEach(button => {
    const key = button.dataset.key;
    const down = e => { e.preventDefault(); teclas.add(key); };
    const up = e => { e.preventDefault(); teclas.delete(key); };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointerleave", up);
    button.addEventListener("pointercancel", up);
  });
  document.getElementById("botonLanzarTactil").addEventListener("pointerdown", e => { e.preventDefault(); lanzarPiedra(); });

  // Compatibilidad con navegadores que no implementen roundRect.
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
      r = Math.min(r, w/2, h/2);
      this.beginPath(); this.moveTo(x+r,y); this.arcTo(x+w,y,x+w,y+h,r);
      this.arcTo(x+w,y+h,x,y+h,r); this.arcTo(x,y+h,x,y,r);
      this.arcTo(x,y,x+w,y,r); this.closePath(); return this;
    };
  }

  reiniciarEstado();
  estadoJuego = "menu";
  requestAnimationFrame(loop);
})();
