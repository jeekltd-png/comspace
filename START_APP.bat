@echo off
echo ============================================
echo   ComSpace - Multi-Tenant E-Commerce App
echo ============================================
echo.
echo Starting servers...
echo.

cd "%~dp0"

REM Kill any existing node processes
taskkill /F /IM node.exe 2>nul

REM Set environment
set NO_DOCKER=true

REM Start backend
echo Starting backend on port 5000...
start "ComSpace Backend" cmd /k "cd backend && set NO_DOCKER=true && npm run dev:no-docker"

REM Wait a bit for backend
timeout /t 5 /nobreak >nul

REM Start frontend  
echo Starting frontend on port 3000...
start "ComSpace Frontend" cmd /k "cd frontend && npm run dev"

REM Wait for servers to start
timeout /t 8 /nobreak >nul

echo.
echo ============================================
echo   Servers are starting...
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000/en
echo.
echo   Admin Login:
echo   Email: demo-admin@demo.local
echo   Password: Admin123!
echo ============================================
echo.
echo Opening browser...
start http://localhost:3000/en

pause
