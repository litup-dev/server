import { FastifyInstance } from 'fastify';
import { JWT_DEV_ACCESS_TOKEN, NODE_ENV } from '@/common/constants.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(fastify: FastifyInstance) {
    await fastify.register(fastifySwagger, {
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'LitUp API',
                description: 'API documentation',
                version: '1.0.0',
            },
            components: {
                securitySchemes: {
                    Authorization: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description:
                            NODE_ENV === 'development'
                                ? `Access Token:\n${JWT_DEV_ACCESS_TOKEN}`
                                : 'JWT 토큰을 입력하세요',
                    },
                },
            },
            security: [{ Authorization: [] }],
        },
    });

    await fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
            persistAuthorization: true,
        },
    });
}
