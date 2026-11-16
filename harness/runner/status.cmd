@echo off
setlocal
node "%~dp0harness.mjs" status %*
exit /b %ERRORLEVEL%
