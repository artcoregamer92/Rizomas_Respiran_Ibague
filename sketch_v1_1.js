// Rizomas que Respiran — sketch_v1_1.js (parchado)
// - Audio robusto: gate + normalización + suavizado + desbloqueo por gesto
// - Nunca colapsa al centro si no hay señal (pulso >= 0)
// - Slider de respaldo (G) si el mic falla
// - Presets rápidos y HUD opcional de depuración (tecla D)
// - Mejoras de rendimiento: pixelDensity(1), frameRate(60)

let mic, amp, useMic = true, level = 0, slider, font;
let particles = [];
let baseSpeed = 0.6;     // velocidad base del campo
let ampGain  = 1.0;      // ganancia de amplitud (↑/↓)
let showText = true;     // alterna poema (T)
let poemLines = [];
let hueBase = 200;       // HSB: 200 ~ azul-agua
let breathSmoothed = 0;  // respiración suavizada
let DEBUG = false;       // alternar con tecla D

// Parámetros de respiración
const GATE = 0.03;       // umbral contra ruido ambiente (ajusta 0.02–0.05)
const LVL_MAX = 0.35;    // techo típico antes de distorsión
const BREATH_SMOOTH = 0.12; // lerp del aliento

function preload(){
  // Tipografía opcional local: coloca un .ttf en assets/text y descomenta
  // font = loadFont('assets/text/YourFont.ttf');
  // Poema: si no existe, usamos un fallback
  loadStrings('assets/text/poema.txt',
    (lines)=> poemLines = lines.filter(s => s.trim().length),
    ()=> poemLines = ["La ciudad inhala.","El río guarda un nombre.","Lo por venir, late.","Entre raíces, una brisa de código.","Respiramos juntas el mapa."]);
}

function setup(){
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(60);
  colorMode(HSB, 255);
  noStroke();

  // Mic + amplitud (si no hay permiso → slider)
  mic = new p5.AudioIn();
  mic.start(() => {}, () => { useMic = false; }); // onError → slider
  amp = new p5.Amplitude();
  amp.setInput(mic);
  amp.smooth(0.85);

  // Slider fallback (oculto por defecto)
  slider = createSlider(0, 100, 10, 1);
  slider.position(20, 20);
  slider.style('width', '180px');
  slider.hide();

  // Partículas
  const N = 1000;
  for (let i=0;i<N;i++) particles.push(new Particle());

  textFont(font || 'system-ui');
  textSize(16); textAlign(CENTER, CENTER);
}

function draw(){
  background(0, 14); // leve estela

  // ===== RESPIRACIÓN =====
  let raw;
  if (useMic){
    raw = amp.getLevel();                      // 0..~0.4
  } else {
    raw = slider.value()/100.0 * 0.3;          // controla con slider
  }
  // Gate + normalización
  let breathNorm = (raw <= GATE) ? 0 : map(raw, GATE, LVL_MAX, 0, 1, true);
  // Suavizado temporal (evita parpadeos)
  breathSmoothed = lerp(breathSmoothed, breathNorm, BREATH_SMOOTH);
  // Pulso final: 0..1 (solo expande)
  let pulse = breathSmoothed;
  // Velocidad global
  let speed = baseSpeed + pulse * 2.0 * ampGain;

  // ===== RENDER =====
  translate(width/2, height/2);
  for (let p of particles){
    p.update(speed, pulse);
    p.show();
  }

  // Texto-poema sutil
  if (showText && frameCount%400<200 && poemLines.length>0){
    resetMatrix();
    fill(0,0,255, 140);
    noStroke();
    rect(0, height-64, width, 64);
    fill(0,0,0);
    let idx = floor(frameCount/200) % poemLines.length;
    text(poemLines[idx], width/2, height-32);
  }

  // HUD de debug (opcional)
  if (DEBUG){
    resetMatrix(); noStroke(); fill(255);
    textSize(12); textAlign(LEFT, TOP);
    const st = getAudioContext().state;
    text(
      `DEBUG ON\\nAudioContext: ${st}\\nraw:${nf(raw,1,3)} breath:${nf(breathSmoothed,1,3)}\\n`+
      `GATE:${GATE} LVL_MAX:${LVL_MAX}\\nampGain:${nf(ampGain,1,2)} baseSpeed:${nf(baseSpeed,1,2)}\\n`+
      `particles:${particles.length} FPS:${floor(frameRate())}`,
      12, 12
    );
  }
}

// ===== Partículas =====
class Particle{
  constructor(){ this.reset(true); }
  reset(randomRadius=false){
    let a = random(TWO_PI);
    let r = randomRadius ? random(10, min(width,height)*0.45) : 10;
    this.x = cos(a)*r;
    this.y = sin(a)*r;
    this.vx = 0; this.vy = 0;
    this.h = (hueBase + random(-12,12)) % 255;
    this.s = random(1.2, 3.6);
  }
  update(speed, pulse){
    // Campo radial que solo expande con el pulso (nunca chupa al centro)
    let r = sqrt(this.x*this.x + this.y*this.y) + 0.0001;
    let dirx = this.x / r, diry = this.y / r;

    // Empuje radial proporcional al pulso
    this.vx += (dirx * pulse) * 0.35;
    this.vy += (diry * pulse) * 0.35;

    // Turbulencia leve para vida orgánica
    this.vx += (noise(this.x*0.002, this.y*0.002)-0.5) * 0.12;
    this.vy += (noise(this.y*0.002, this.x*0.002)-0.5) * 0.12;

    // Fricción + integración
    this.vx *= 0.96; this.vy *= 0.96;
    this.x  += this.vx * speed; 
    this.y  += this.vy * speed;

    // Límites suaves
    let RMAX = min(width,height)*0.52;
    if (r > RMAX) this.reset(false);
    if (r < 8 && pulse === 0) { // evita colapso total cuando no hay audio
      this.x += random(-2,2); this.y += random(-2,2);
    }
  }
  show(){
    fill(this.h, 90, 255, 200);
    ellipse(this.x, this.y, this.s, this.s);
  }
}

// ===== Utilidades =====
function keyPressed(){
  if (key === 'G'){ // mic/slider
    useMic = !useMic;
    if (useMic) slider.hide(); else slider.show();
  }
  else if (keyCode === UP_ARROW){ ampGain = constrain(ampGain + 0.1, 0.2, 3.0); }
  else if (keyCode === DOWN_ARROW){ ampGain = constrain(ampGain - 0.1, 0.2, 3.0); }
  else if (keyCode === LEFT_ARROW){ baseSpeed = max(0.1, baseSpeed - 0.1); }
  else if (keyCode === RIGHT_ARROW){ baseSpeed = min(4.0, baseSpeed + 0.1); }
  else if (key === 'T'){ showText = !showText; }
  else if (key === 'F'){ let fs = fullscreen(); fullscreen(!fs); }
  else if (key === 'S'){ saveCanvas('rizomas_frame', 'png'); }
  else if (key === 'D'){ DEBUG = !DEBUG; }
}

function mousePressed(){
  // Desbloquea el AudioContext si está suspendido (Chrome/Firefox)
  try { userStartAudio(); getAudioContext().resume(); } catch(e){}
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
