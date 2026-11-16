@echo off
setlocal
node "%~dp0..\runner\harness.mjs" validate-task %*
exit /b %ERRORLEVEL%
