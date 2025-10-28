#!/bin/bash
set -e

REMOTE_USER="litup"
REMOTE_HOST="220.93.50.45"
REMOTE_PATH="/Users/litup/workspace/litup/dockers/server/app"
REMOTE_PORT="4342"

echo "Sending .env to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
rsync -avz -e "ssh -p ${REMOTE_PORT}" .env ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}

echo "✅ 전송 완료!"