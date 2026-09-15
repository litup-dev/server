@echo off
setlocal

set REMOTE_USER=litup
set REMOTE_HOST=seohae-server.iptime.org
set REMOTE_PATH=/Users/litup/workspace/litup/dockers/server/app
set REMOTE_PORT=4342

echo 🚀 Sending .env file to %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%
scp -P %REMOTE_PORT% .env %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_PATH%

if %errorlevel% neq 0 (
    echo 전송 실패!
    exit /b 1
) else (
    echo 전송 성공!
)