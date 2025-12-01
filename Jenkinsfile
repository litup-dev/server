pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        REMOTE_USER  = 'litup'
        REMOTE_SERVER = '220.93.50.45'
        REMOTE_PORT  = '4342'
        REMOTE_PATH  = '/Users/litup/workspace/litup/dockers/server'
        APP_PATH     = "${REMOTE_PATH}/app"
    }

    stages {
        stage('Checkout') {
            steps {
                // Git safe directory 설정
                sh 'git config --global --add safe.directory /var/jenkins_home/workspace/server || true'
                
                // 워크스페이스 정리
                deleteDir()
                
                git credentialsId: 'backend_credential', 
                    branch: 'main', 
                    url: 'https://github.com/litup-dev/server.git'
            }
        }

        stage('Install & Build') {
            steps {
                sh 'git clean -fdx || true' 
                sh 'yarn install --immutable'
                // sh 'yarn prisma generate'
                sh 'yarn build'
            }
        }

        stage('Transfer, Backup & Deploy') {
            steps {
                script {
                    sshagent(credentials: ['backend_credential']) {
                        sh """
                            echo "🚀 전송 시작: dist 폴더"
                            scp -P ${REMOTE_PORT} \
                                -o StrictHostKeyChecking=no \
                                -r dist ${REMOTE_USER}@${REMOTE_SERVER}:${APP_PATH}/dist_new

                            scp -P ${REMOTE_PORT} \
                                -o StrictHostKeyChecking=no \
                                -r package.json .yarnrc.yml yarn.lock prisma \
                                ${REMOTE_USER}@${REMOTE_SERVER}:${APP_PATH}/

                            echo "📦 원격 서버에서 배포 및 백업 진행"
                            ssh -p ${REMOTE_PORT} \
                                -o StrictHostKeyChecking=no \
                                ${REMOTE_USER}@${REMOTE_SERVER} 'bash -s' <<'DEPLOY'

set -e
cd ${APP_PATH}

# 백업 디렉토리 생성
mkdir -p backup
TIMESTAMP=\$(date +%Y%m%d-%H%M%S)

# 기존 dist 백업
if [ -d "dist" ]; then
    cp -r dist backup/dist_backup_\${TIMESTAMP}
    echo "✅ dist 백업 완료: backup/dist_backup_\${TIMESTAMP}"
    rm -rf dist/*
else
    mkdir dist
fi

# 새 dist 배포
cp -r dist_new/* dist/
rm -rf dist_new
echo "✅ 새 dist 배포 완료"

# Docker 컨테이너 재시작
echo "🔄 Docker 컨테이너 재시작"
/usr/local/bin/docker compose down
/usr/local/bin/docker compose up -d --build
echo "✅ Docker 컨테이너 재시작 완료"

DEPLOY
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ 배포 성공!'
        }
        failure {
            echo '❌ 배포 실패!'
        }
    }
}