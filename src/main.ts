import Fastify from 'fastify';
import { PORT, HOST, DATABASE_URL } from './common/constants.js';
import { loggerOptions } from './common/loggerOptions.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';

const app = Fastify({
    logger: loggerOptions,
    ajv: {
    customOptions: {
      strict: false,
    },
  },
});

// 플러그인 등록
await registerPlugins(app);

await registerRoutes(app);

app.get('/', async (request, reply) => {
    return { hello: 'world' };
});

// Graceful shutdown
app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
});

const start = async () => {
    try {
        await app.listen({ port: PORT, host: HOST });
        app.log.info(`****************************************************************`);
        app.log.info(`LitUp API Server Started and Listening at http://${HOST}:${PORT}`);
        app.log.info(`Database URL: ${DATABASE_URL?.split('@')[1] || 'Not configured'}`); // 비밀번호 제외
        app.log.info(`****************************************************************`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();