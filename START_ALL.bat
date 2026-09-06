@echo off
echo ========================================
echo    Starting AI-LMS (Both Servers)
echo ========================================
echo.
echo Starting Backend...
start cmd /k "cd /d c:\Users\Daniel\.gemini\antigravity\scratch\final_project\backend && python -m uvicorn main:app --reload"
echo.
echo Starting Frontend...
timeout /t 3 >nul
start cmd /k "cd /d c:\Users\Daniel\.gemini\antigravity\scratch\final_project\frontend && npm run dev"
echo.
echo ========================================
echo    Both servers starting!
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:5173
echo ========================================
echo.
echo    Want to share with others?
echo    Run START_TUNNEL.bat to get:
echo    https://ailms.serveo.net (public URL)
echo ========================================
echo.
timeout /t 5 >nul
start http://localhost:5173
echo Browser opened! You can close this window.
timeout /t 3 >nul
