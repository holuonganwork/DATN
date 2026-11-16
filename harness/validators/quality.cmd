@echo off
setlocal
node "%~dp0..\runner\harness.mjs" validate-quality %*
exit /b %ERRORLEVEL%
