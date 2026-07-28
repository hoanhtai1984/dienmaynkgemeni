@echo off
chcp 65001 >nul
echo ============================================
echo   Dien May NK - Khoi dong Server/Client/AI
echo ============================================
echo.
echo LUU Y: Nho mo Laragon va bam "Start All" (MySQL)
echo TRUOC KHI chay file nay, neu chua bat.
echo.
pause

start "Dien May NK - Server (4000)" cmd /k "cd /d %~dp0server && npm run dev"
start "Dien May NK - Client (5173)" cmd /k "cd /d %~dp0client && npm run dev"
start "Dien May NK - AI Service (8000)" cmd /k "cd /d %~dp0ai-service && venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000"

echo.
echo Da mo 3 cua so rieng cho Server, Client, AI Service.
echo Dong cua so nao la tat dich vu do - dung tat het thi dong tat ca 3.
