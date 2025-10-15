# Rizomas que Respiran — Paquete de show (plantillas)
Este paquete incluye una base **p5.js** (`index.html` + `sketch.js`) y una base **Hydra** (`hydra.html`).

## 1) Cómo ejecutar
- Abre `index.html` en tu navegador (Chrome/Edge/Firefox). Presiona **F** para pantalla completa.
- Si el navegador te pide permisos de micrófono, acéptalos. Si no hay micrófono, presiona **G** para usar el **slider**.
- Alternativa: abre `hydra.html` para una versión en **Hydra**.

> **Offline:** descarga `p5.min.js`, `p5.sound.min.js`, `hydra-synth.min.js` y colócalos en `./libs/`. Las plantillas intentan usar local primero y, si no están, usan CDN.

## 2) Controles (p5.js)
- **G**: alterna micrófono/slider (si no hay micrófono o quieres control manual).
- **↑/↓**: sube/baja la **amplitud** del aliento.
- **←/→**: baja/sube la **velocidad** base.
- **T**: muestra/oculta línea de **poema**.
- **F**: alterna **pantalla completa**.
- **S**: guarda una **captura** PNG.

## 3) Personalización rápida
- Cambia el color base en `sketch.js` (`hueBase = 200`). Prueba 35 (ámbar), 120 (verde), 300 (magenta).
- Reemplaza `assets/text/poema.txt` con tus líneas (una por renglón).
- Ajusta la cantidad de partículas y suavizado de audio (`amp.smooth(0.85)`).

## 4) Grabar un master (Plan B)
- Usa **OBS** o el grabador de pantalla del sistema para capturar la salida a **1920×1080 @ 30fps**.
- Exporta el audio ambiente o agrega una pista desde tu editor (Premiere/Resolve).
- Deja un **loop** suave (corte en momentos oscuros).

## 5) Presentación en vivo
- Recomendado: prueba con proyector antes del día (brillo/contraste).
- Lleva al sitio: laptop con GPU, proyector ≥7000 lm, audio, extensiones, cinta gaffer.
- Si algo falla, reproduce `MASTER.mp4` (cuando lo exportes) con **VLC** en loop.

## 6) TouchDesigner (esquema rápido)
**TOPs:** Noise → Feedback → Displace (mapa desde FFT) → Level → Out  
**CHOPs:** Audio Device In → Spectrum → Filter → exportar a parámetros de Noise/Displace  
Activa **Perform Mode** (F1). Ajusta resolución y FPS.
