import { FastifyInstance } from 'fastify';
import { ClubService } from '@/services/club.service.js';
import {
    getClubsJson,
    GetClubsType,
    clubDetailResJson,
    toggleFavoriteResJson,
    clubSearchResJson,
} from '@/schemas/club.schema.js';
import { idParamSchema, idParamJson, errorResJson } from '@/schemas/common.schema.js';
import { BadRequestError } from '@/common/error.js';
import { parseJwt, parseJwtOptional } from '@/utils/jwt.js';
import { parse } from 'path';

export async function clubRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/clubs',
        {
            schema: {
                querystring: getClubsJson,
                tags: ['Clubs'],
                summary: '클럽 목록 조회',
                description: '클럽 목록 조회',
                response: {
                    200: clubSearchResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetClubsType;
            console.log('query', query);
            const service = new ClubService(request.server.prisma);
            const userId = parseJwtOptional(request.headers);
            const result = await service.getSearch(query, userId);

            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/clubs/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Clubs'],
                summary: '클럽 상세 조회',
                description: '클럽 상세 조회',
                response: {
                    200: clubDetailResJson,
                    400: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }

            const { entityId } = parsed.data;
            const userId = parseJwtOptional(request.headers);
            const service = new ClubService(request.server.prisma);
            const result = await service.getById(entityId, userId);

            return reply.send({ data: result });
        }
    );

    fastify.post(
        '/clubs/:entityId/favorite',
        {
            schema: {
                params: idParamJson,
                tags: ['Clubs'],
                summary: '클럽 즐겨찾기 등록/해제',
                description: '클럽 즐겨찾기 등록/해제',
                response: {
                    200: toggleFavoriteResJson,
                    400: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }

            const { entityId } = parsed.data;

            const { userId } = parseJwt(request.headers);

            const service = new ClubService(request.server.prisma);
            const result = await service.toggleFavorite(entityId, userId);

            return reply.send({ data: result });
        }
    );
}
