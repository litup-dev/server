import { FastifyInstance } from 'fastify';
import { ClubService } from '@/services/club.service.js';
import {
    getClubsJson,
    GetClubsType,
    clubDetailResJson,
    clubListResJson,
    toggleFavoriteResJson,
} from '@/schemas/club.schema.js';
import { idParamSchema, idParamJson, errorResJson } from '@/schemas/common.schema.js';
import { BadRequestError } from '@/common/error.js';

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
                    200: clubListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetClubsType;

            const service = new ClubService(request.server.prisma);
            const result = await service.getAll(query.offset, query.limit);

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

            const service = new ClubService(request.server.prisma);
            const result = await service.getById(entityId);

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
                // response: {
                //     200: toggleFavoriteResJson,
                //     400: errorResJson,
                //     404: errorResJson,
                //     500: errorResJson,
                // },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }

            const { entityId } = parsed.data;

            const headers = request.headers;
            const authorization = headers['authorization']!;

            // "Bearer <token>" 형식에서 토큰만 추출
            const token = authorization.replace(/^Bearer\s+/i, '');
            let userId = 0;
            // JWT는 header.payload.signature 형식
            const parts = token.split('.');
            if (parts.length !== 3) {
                return reply.status(400).send({ error: 'Invalid JWT format' });
            }

            try {
                const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8'));

                // userId 추출 (payload 구조에 따라 키 이름 조정 필요)
                userId = Number(payload.userId) || Number(payload.sub) || Number(payload.id);
            } catch (err) {
                return reply.status(400).send({ error: 'Failed to parse JWT payload' });
            }
            console.log('Extracted userId from JWT:', userId);
            const service = new ClubService(request.server.prisma);
            const result = await service.toggleFavorite(entityId, userId);

            return reply.send({ data: result });
        }
    );
}
