@echo off
setlocal
node "%~dp0..\runner\harness.mjs" validate-scope %*
exit /b %ERRORLEVEL%
