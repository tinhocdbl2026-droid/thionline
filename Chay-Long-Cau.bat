@echo off
setlocal
title Long cau goi ten hoc sinh
pushd "%~dp0"
if errorlevel 1 exit /b 1
where node.exe >nul 2>&1
if errorlevel 1 goto node_error
where npm.cmd >nul 2>&1
if errorlevel 1 goto node_error
node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit((a===22 && b>=12)||a>22?0:1)"
if errorlevel 1 goto node_error
if not exist "node_modules\.install-complete" (
    echo Dang cai dat thu vien. Lan dau can Internet...
    call npm.cmd ci
    if errorlevel 1 goto install_error
    echo OK>"node_modules\.install-complete"
)
echo Giu cua so nay mo khi su dung. Nhan Ctrl+C de dung.
call npm.cmd run dev -- --host 127.0.0.1 --open
if errorlevel 1 goto run_error
popd
exit /b 0
:node_error
echo Hay cai Node.js 22 LTS tu 22.12 tro len tai https://nodejs.org/.
goto failed
:install_error
echo Cai dat that bai. Kiem tra Internet va thong bao loi o tren.
goto failed
:run_error
echo Khoi dong that bai. Xem thong bao loi o tren.
:failed
pause
popd
exit /b 1