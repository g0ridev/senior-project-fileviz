@echo off
echo Starting FileViz servers...

start "Browse API (5000)" cmd /k "cd /d %~dp0backend-folder-jeremy\FileViz\testfolder && dotnet run"
start "Search API (5001)" cmd /k "cd /d %~dp0backend-folder-jeremy\FileViz\testsearch && dotnet run"
start "Settings API (5002)" cmd /k "cd /d %~dp0backend-folder-jeremy\FileViz\testsettings && dotnet run"
start "Frontend (5173)" cmd /k "cd /d %~dp0frontend-folder-ryan && npm run dev"

echo All 4 servers started. Close this window anytime.
