@echo off
setlocal
node "%~dp0harness.mjs" resume %*
exit /b %ERRORLEVEL%
