import Fastify from 'fastify';
import { PORT, HOST, DATABASE_URL } from './common/constants.js';
import { loggerOptions } from './common/loggerOptions.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { setupErrorHandler } from './common/errorHandler.js';
import { NicknameService } from './services/nickname.service.js';
import { getTsid } from 'tsid-ts';

const app = Fastify({
    logger: loggerOptions,
    ajv: {
        customOptions: {
            strict: false,
        },
    },
});

// 전역 에러 핸들러 설정
setupErrorHandler(app);

// 플러그인 등록
await registerPlugins(app);
await registerRoutes(app);

app.get('/', async (request, reply) => {
    let tsid = '';
    for (let i = 0; i < 10; i++) {
        tsid = getTsid().toString();
        console.log(tsid);
    }
    return reply.redirect('/docs');
});

// Graceful shutdown
app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
});

const start = async () => {
    try {
        await app.listen({ port: PORT, host: HOST });
        app.log.info(`****************************************************************`);
        app.log.info(`LitUp API Server Started and Listening at http://${HOST}:${PORT}/docs`);
        app.log.info(`Database URL: ${DATABASE_URL?.split('@')[1] || 'Not configured'}`); // 비밀번호 제외
        app.log.info(`****************************************************************`);

        // 닉네임 생성에 사용할 단어 리스트 초기화
        // await 처리를 하지 않아. 사용하는 곳에서 null 처리 필수
        const commonService = new NicknameService(app.prisma);
        commonService.init().catch((err) => {
            app.log.error('닉네임 생성 클래스 초기화 실패', err);
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
