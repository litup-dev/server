import { FastifyInstance } from 'fastify';
import { PORT, HOST } from '@/common/constants.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(fastify: FastifyInstance) {
    await fastify.register(fastifySwagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'LitUp API',
                description: 'API documentation',  
                version: '1.0.0',
            },
            servers: [
                {
                    url: `http://${HOST}:${PORT}`,
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
