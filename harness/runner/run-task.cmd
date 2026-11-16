@echo off
setlocal
node "%~dp0harness.mjs" run %*
exit /b %ERRORLEVEL%
