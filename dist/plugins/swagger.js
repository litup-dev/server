import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
export async function registerSwagger(fastify) {
    await fastify.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Fastify Prisma API',
                description: 'API documentation',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:10000',
                    description: 'Development server',
                },
            ],
        },
    });
    await fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
    });
}
//# sourceMappingURL=swagger.js.map