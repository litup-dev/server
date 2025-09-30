import fastify from 'fastify'
import pino from 'pino';

const app = fastify(
    {logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true
            }
        }
    }}
);

app.get("/", async (request, reply) => {
  return { hello: "world" };
});

const start = async () => {
  try {
    await app.listen({ port: 3000 }) // { port: 3000, host: '0.0.0.0' }
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()