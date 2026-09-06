@echo off
echo ========================================
echo    AI-LMS Backend Server Starting...
echo ========================================
echo.
cd /d c:\Users\Daniel\.gemini\antigravity\scratch\final_project\backend
echo Installing dependencies...
python -m pip install fastapi uvicorn psycopg2-binary bcrypt python-multipart "pydantic[email]" -q
echo.
echo Starting backend on http://localhost:8000
echo Press Ctrl+C to stop
echo.
python -m uvicorn main:app --reload
pause
