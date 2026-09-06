@echo off
echo ========================================
echo    Serveo Public Tunnel
echo ========================================
echo.
echo This will create a public URL for your LOCAL frontend.
echo Make sure your servers are already running first!
echo (Run START_ALL.bat first)
echo.
echo Your public URL will be:
echo    https://ailms.serveo.net
echo.
echo Press Ctrl+C to stop the tunnel.
echo ========================================
echo.
ssh -R ailms:80:localhost:5173 serveo.net
