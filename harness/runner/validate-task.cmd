@echo off
setlocal
node "%~dp0harness.mjs" validate %*
exit /b %ERRORLEVEL%
