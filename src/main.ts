import fastify from 'fastify';
import { PORT, HOST } from './common/constants.js';
import { loggerOptions } from './common/loggerOptions.js';

const app = fastify({
    logger: loggerOptions,
});

app.get('/', async (request, reply) => {
    return { hello: 'world' };
});

const start = async () => {
    try {
        await app.listen({ port: PORT, host: HOST });
        app.log.info(`****************************************************************`);
        app.log.info(`LitUp API Server Started and Listening at http://${HOST}:${PORT}`);
        app.log.info(`****************************************************************`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
