@echo off
REM Abre index.html en modo kiosk si es posible
setlocal
set FILE=%~dp0index.html
REM Intentar Chrome
start "" chrome --kiosk "%FILE%"
REM Si Chrome no está, intentar Edge
start "" msedge --kiosk "%FILE%"
REM Si no, abrir con navegador por defecto
start "" "%FILE%"
