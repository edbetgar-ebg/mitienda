@echo off
title Actualizando tienda...
cd /d "%~dp0"
echo.
echo ====================================
echo    ACTUALIZANDO CATALOGO
echo ====================================
echo.
node generar-productos.js
echo.
echo Listo. Abre index.html
pause