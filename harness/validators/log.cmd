@echo off
setlocal
node "%~dp0..\runner\harness.mjs" validate-log %*
exit /b %ERRORLEVEL%
