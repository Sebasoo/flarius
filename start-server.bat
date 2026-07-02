@echo off
cd /d "%~dp0"
echo Flarius prototype: http://127.0.0.1:8765/
echo Press Ctrl+C to stop.
py -m http.server 8765
