@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Necesitas instalar Node.js 18 o mas nuevo: https://nodejs.org
  echo.
  pause
  exit /b 1
)
node server\oficina-server.js %*
pause
