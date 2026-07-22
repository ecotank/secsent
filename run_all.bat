@echo off
title SecureOffice-AI Startup Controller
color 0a

echo ==================================================
echo    SecureOffice-AI - Sistem Persuratan Digital
echo ==================================================
echo.

:: 1. Menjalankan Database PostgreSQL & Redis via Docker
echo [1/5] Menghidupkan Infrastruktur Database (PostgreSQL & Redis)...
docker-compose up -d postgres redis
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Docker tidak terdeteksi aktif. Pastikan Docker Desktop telah berjalan jika ingin terhubung secara dinamis.
)
echo.

:: 2. Menjalankan Backend Core Service
echo [2/5] Memulai Layanan Backend Core (Go - Port 8080)...
start "SecureOffice-AI: Backend Core (:8080)" cmd /c "cd backend && go run cmd/api/main.go"
timeout /t 2 >nul

:: 3. Menjalankan Crypto Service
echo [3/5] Memulai Layanan Crypto Service (Go - Port 8081)...
start "SecureOffice-AI: Crypto Service (:8081)" cmd /c "cd crypto-service && go run cmd/api/main.go"
timeout /t 2 >nul

:: 4. Menjalankan AI Subsystem Service
echo [4/5] Memulai Layanan AI Subsystem (Python - Port 8000)...
start "SecureOffice-AI: AI Subsystem (:8000)" cmd /c "cd ai-service && uvicorn app.main:app --reload --port 8000"
timeout /t 2 >nul

:: 5. Menjalankan Frontend Client SPA
echo [5/5] Memulai Layanan Frontend Client (React - Port 5173)...
start "SecureOffice-AI: Frontend Web (:5173)" cmd /c "cd frontend && npm run dev"
timeout /t 3 >nul

:: 6. Mengarahkan Browser ke Web Aplikasi
echo.
echo ==================================================
echo [OK] Seluruh Layanan Berhasil Dijalankan!
echo Mengarahkan browser Anda ke http://localhost:5173 ...
echo ==================================================
start http://localhost:5173

echo.
echo Tetap buka jendela ini atau tutup jika seluruh layanan sudah selesai dimuat.
echo Tekan tombol apa saja untuk keluar.
pause >nul
