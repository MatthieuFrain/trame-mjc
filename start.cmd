@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Installez Node.js 22 ou une version LTS plus recente depuis nodejs.org.
  pause
  exit /b 1
)
if not exist dist\client\index.html (
  call npm ci
  if errorlevel 1 exit /b 1
  call npm run build
  if errorlevel 1 exit /b 1
)
echo Ouvrez http://127.0.0.1:4173 dans votre navigateur.
node server.mjs
pause
