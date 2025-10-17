// Rizomas que Respiran — sketch_v1_3_camfix.js
// v1_3 con cámara robusta (start/stop, HTTPS, gesture play, debug)

let mic, amp, useMic = true, slider;
let particles = [];
let baseSpeed = 0.6, ampGain = 1.0;
let showText = true, poemLines = [], hueBase = 200;
let breathSmoothed = 0, DEBUG = false;

const TEXT_CENTER = 0, TEXT_SUB = 1; let textMode = TEXT_CENTER;
const GATE = 0.03, LVL_MAX = 0.35, BREATH_SMOOTH = 0.12;

let cam, camPrev, camStream = null;
let camW = 320, camH = 240, camStep = 6;
let camEnabled = true, camPreview = false, camReady = false;
let motion = 0, motionSmoothed = 0, motionSensitivity = 1.0;
let camError = "";

function preload(){
  loadStrings('assets/text/poema.txt',
    (lines)=> poemLines = lines.filter(s => s.trim().length),
    ()=> poemLines = ["La ciudad inhala.","El río guarda un nombre.","Lo por venir, late.","Entre raíces, una brisa de código.","Respiramos juntas el mapa."]);
}

function setup(){
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); frameRate(60);
  colorMode(HSB, 255); noStroke();

  mic = new p5.AudioIn();
  mic.start(() => {}, () => { useMic = false; });
  amp = new p5.Amplitude(); amp.setInput(mic); amp.smooth(0.85);

  slider = createSlider(0, 100, 10, 1);
  slider.position(20, 20); slider.style('width','180px'); slider.hide();

  camPrev = createGraphics(camW, camH); camPrev.pixelDensity(1);
  startCam();

  for (let i=0;i<1000;i++) particles.push(new Particle());
  textFont('system-ui'); textSize(16); textAlign(CENTER, CENTER);
}

async function startCam(){
  camError = ""; camReady = false;
  try{
    if (location.protocol === 'http:' && location.hostname !== 'localhost'){
      camError = "Usa HTTPS o localhost para cámara"; camEnabled = false; return;
    }
    if (camStream){ stopCam(); }
    const constraints = { video: { width:{ideal:camW}, height:{ideal:camH}, facingMode:'user' }, audio:false };
    cam = createCapture(constraints, ()=>{});
    cam.elt.setAttribute('playsinline','true'); cam.elt.muted = true; cam.elt.autoplay = true;
    cam.size(camW, camH); cam.hide();
    cam.elt.addEventListener('loadeddata', ()=>{ camReady = true; });
    cam.elt.addEventListener('error', e=>{ camError = 'Video error: '+e.message; });
    camStream = cam.elt.srcObject || null;
    camEnabled = true;
  }catch(e){ camEnabled = false; camError = (e && e.message)? e.message : String(e); }
}
function stopCam(){
  try{ if (camStream){ camStream.getTracks().forEach(t=>t.stop()); } }catch(e){}
  camStream = null; camReady = false; if (cam){ try{ cam.remove(); }catch(e){} } cam = null;
}

function draw(){
  background(0,14);
  let raw = useMic ? amp.getLevel() : slider.value()/100.0 * 0.3;
  let breathNorm = (raw <= GATE) ? 0 : map(raw, GATE, LVL_MAX, 0, 1, true);
  breathSmoothed = lerp(breathSmoothed, breathNorm, BREATH_SMOOTH);

  if (camEnabled && cam && camReady){
    cam.loadPixels(); camPrev.loadPixels();
    if (cam.pixels.length > 0 && camPrev.pixels.length > 0){
      let sum=0, count=0;
      for (let y=0; y<camH; y+=camStep){
        for (let x=0; x<camW; x+=camStep){
          let i=(y*camW+x)*4;
          let r=cam.pixels[i], g=cam.pixels[i+1], b=cam.pixels[i+2];
          let pr=camPrev.pixels[i], pg=camPrev.pixels[i+1], pb=camPrev.pixels[i+2];
          let L=(0.2126*r+0.7152*g+0.0722*b), LP=(0.2126*pr+0.7152*pg+0.0722*pb);
          sum += Math.abs(L-LP); count++;
        }
      }
      let m = sum/(count*255); motion = isFinite(m)?m:0;
      motionSmoothed = lerp(motionSmoothed, motion, 0.15);
      camPrev.copy(cam,0,0,camW,camH,0,0,camW,camH);
    }
  } else { motionSmoothed = lerp(motionSmoothed, 0, 0.1); }

  let motionFactor = constrain(motionSmoothed * motionSensitivity, 0, 1);
  let pulse = constrain(breathSmoothed + motionFactor*0.6, 0, 1);
  let speed = baseSpeed + pulse * 2.0 * ampGain;

  translate(width/2, height/2);
  for (let p of particles){ p.update(speed, pulse); p.show(); }

  if (showText && poemLines.length>0) renderTextLayer();

  if (camPreview && cam && camReady){
    resetMatrix(); noFill(); stroke(255,150);
    let w=camW*1.2, h=camH*1.2; image(cam,12,12,w,h); rect(12,12,w,h); noStroke();
  }

  if (DEBUG){
    resetMatrix(); noStroke(); fill(255); textSize(12); textAlign(LEFT,TOP);
    const st = getAudioContext().state;
    text(
      'DEBUG ON\nAudio:'+st+'\n'+
      'Cam enabled='+camEnabled+' ready='+camReady+' err='+(camError||'none')+' proto='+location.protocol+'\n'+
      'Motion:'+nf(motionSmoothed,1,3)+' sens:'+nf(motionSensitivity,1,2)+'\n'+
      'ampGain:'+nf(ampGain,1,2)+' baseSpeed:'+nf(baseSpeed,1,2)+' FPS:'+floor(frameRate()),
      12, height-84);
  }
}

function renderTextLayer(){
  resetMatrix();
  const txt = poemLines[floor(frameCount/200) % poemLines.length];
  if (textMode === TEXT_CENTER){
    let fs = min(width,height)*0.06; textSize(fs); textAlign(CENTER,CENTER);
    drawingContext.shadowColor = 'rgba(0,0,0,0.85)'; drawingContext.shadowBlur = fs*0.45;
    fill(210,40,255); noStroke(); text(txt, width/2, height*0.5); drawingContext.shadowBlur=0;
  } else {
    let barH = max(64, height*0.12);
    noStroke(); fill(0,0,0,220); rect(0,height-barH,width,barH);
    let fs = min(width,height)*0.048; textSize(fs); textAlign(CENTER,CENTER);
    fill(0,0,255); text(txt, width/2, height - barH/2);
  }
}

class Particle{
  constructor(){ this.reset(true); }
  reset(randomRadius=false){
    let a = random(TWO_PI); let r = randomRadius ? random(10, min(width,height)*0.45) : 10;
    this.x = cos(a)*r; this.y = sin(a)*r; this.vx = 0; this.vy = 0;
    this.h = (hueBase + random(-12,12)) % 255; this.s = random(1.2, 3.6);
  }
  update(speed, pulse){
    let r = sqrt(this.x*this.x + this.y*this.y) + 0.0001;
    let dirx = this.x / r, diry = this.y / r;
    this.vx += (dirx * pulse) * 0.35; this.vy += (diry * pulse) * 0.35;
    this.vx += (noise(this.x*0.002, this.y*0.002)-0.5) * 0.12;
    this.vy += (noise(this.y*0.002, this.x*0.002)-0.5) * 0.12;
    this.vx *= 0.96; this.vy *= 0.96; this.x += this.vx * speed; this.y += this.vy * speed;
    let RMAX = min(width,height)*0.52; if (r > RMAX) this.reset(false);
    if (r < 8 && pulse === 0) { this.x += random(-2,2); this.y += random(-2,2); }
  }
  show(){ fill(this.h,90,255,200); ellipse(this.x,this.y,this.s,this.s); }
}

function keyPressed(){
  if (key === 'G'){ useMic = !useMic; if (useMic) slider.hide(); else slider.show(); }
  else if (keyCode === UP_ARROW){ ampGain = constrain(ampGain + 0.1, 0.2, 3.0); }
  else if (keyCode === DOWN_ARROW){ ampGain = constrain(ampGain - 0.1, 0.2, 3.0); }
  else if (keyCode === LEFT_ARROW){ baseSpeed = max(0.1, baseSpeed - 0.1); }
  else if (keyCode === RIGHT_ARROW){ baseSpeed = min(4.0, baseSpeed + 0.1); }
  else if (key === 'T'){ showText = !showText; }
  else if (key === 'Y' || key === 'y'){ textMode = (textMode===TEXT_CENTER)?TEXT_SUB:TEXT_CENTER; }
  else if (key === 'C' || key === 'c'){ camEnabled = !camEnabled; if (camEnabled) startCam(); else stopCam(); }
  else if (key === 'V' || key === 'v'){ camPreview = !camPreview; }
  else if (key === '['){ motionSensitivity = max(0.2, motionSensitivity - 0.1); }
  else if (key === ']'){ motionSensitivity = min(3.0, motionSensitivity + 0.1); }
  else if (key === 'F'){ let fs = fullscreen(); fullscreen(!fs); }
  else if (key === 'S'){ saveCanvas('rizomas_frame', 'png'); }
  else if (key === 'D'){ DEBUG = !DEBUG; }
}

function mousePressed(){ 
  try { userStartAudio(); getAudioContext().resume(); } catch(e){}
  try { if (cam && cam.elt && cam.elt.play) cam.elt.play(); } catch(e){}
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
