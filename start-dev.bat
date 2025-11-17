@echo off
echo Checking if port 3000 is in use...

:: Find process using port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Found process %%a using port 3000
    echo Killing process...
    taskkill //F //PID %%a
    timeout /t 2 /nobreak >nul
)

echo Starting development server on port 3000...
npm run dev
