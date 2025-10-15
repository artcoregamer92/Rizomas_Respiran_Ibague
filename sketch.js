// Rizomas que Respiran — p5.js template (offline-friendly)
// Controles: G alterna mic/slider, ↑/↓ amplitud, ←/→ velocidad, T texto, F fullscreen, S captura
let mic, amp, useMic = true, level = 0, slider, font;
let particles = [], baseSpeed = 0.6, ampGain = 1.0;
let showText = true, poemLines = [];
let hueBase = 200; // azul-agua

function preload(){
  // tipografía opcional local: coloca un .ttf en assets/text y descomenta
  // font = loadFont('assets/text/YourFont.ttf');
  // poema opcional: assets/text/poema.txt
  loadStrings('assets/text/poema.txt', (lines)=> poemLines = lines, ()=> poemLines = []);
}

function setup(){
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);           // NUEVO: FPS más estables
  frameRate(60);
  colorMode(HSB, 255);
  noStroke();
  // Mic + amplitud
  mic = new p5.AudioIn();
  mic.start(() => {}, () => { useMic = false; }); // si falla permiso → slider
  amp = new p5.Amplitude();
  amp.setInput(mic);
  amp.smooth(0.85);
  // Slider fallback
  slider = createSlider(0, 100, 10, 1);
  slider.position(20, 20);
  slider.style('width', '180px');
  slider.hide();
  // Partículas
  const N = 900;
  for (let i=0;i<N;i++) particles.push(new Particle());
  textFont(font || 'system-ui');
  textSize(16); textAlign(CENTER, CENTER);
}

function draw(){
  background(0, 14); // leve estela
  // Entrada de "aliento"
  if (useMic){
    level = amp.getLevel();            // 0..~0.4
  } else {
    level = slider.value()/100.0 * 0.3;
  }
  // Adelgazamos ruido: umbral + mapeo
  const gate = 0.02;
  let breath = level < gate ? 0 : map(level, gate, 0.35, 0.0, 1.0, true);
  let speed = baseSpeed + breath * 2.0 * ampGain;
  // Centro
  translate(width/2, height/2);
  // Render partículas
  for (let p of particles){
    p.update(speed, breath);
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
}

class Particle{
  constructor(){ this.reset(true); }
  reset(randomRadius=false){
    let a = random(TWO_PI);
    let r = randomRadius ? random(10, min(width,height)*0.45) : 10;
    this.x = cos(a)*r;
    this.y = sin(a)*r;
    this.vx = 0; this.vy = 0;
    this.h = (hueBase + random(-12,12)) % 255;
    this.s = random(1, 3.3);
  }
  update(speed, breath){
    // campo radial con respiración (expande/contrae)
    let r = sqrt(this.x*this.x + this.y*this.y) + 0.0001;
    let dirx = this.x / r, diry = this.y / r;
    // pulso: alejamos/acercamos con un leve ruido
    let pulse = (breath - 0.5) * 0.6; // [-0.3..0.3]
    this.vx += (dirx * pulse + (noise(this.x*0.002, this.y*0.002)-0.5)*0.2) * 0.6;
    this.vy += (diry * pulse + (noise(this.y*0.002, this.x*0.002)-0.5)*0.2) * 0.6;
    // inercia + fricción
    this.vx *= 0.96; this.vy *= 0.96;
    this.x += this.vx * speed; this.y += this.vy * speed;
    // regreso si sale de borde
    if (r > min(width,height)*0.55) this.reset(false);
  }
  show(){
    fill(this.h, 90, 255, 200);
    ellipse(this.x, this.y, this.s, this.s);
  }
}

function keyPressed(){
  if (key === 'G'){ // alterna mic/slider
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
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); }


function mousePressed(){ try { userStartAudio(); getAudioContext().resume(); } catch(e){} }
