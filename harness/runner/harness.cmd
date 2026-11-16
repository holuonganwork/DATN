@echo off
setlocal
node "%~dp0harness.mjs" %*
exit /b %ERRORLEVEL%
