import { FastifyInstance } from 'fastify';
import { ClubService } from '@/services/club.service.js';
import {
    createClubJson,
    CreateClubType,
    updateClubJson,
    UpdateClubType,
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
        '/clubs',
        {
            schema: {
                body: createClubJson,
                tags: ['Clubs'],
                summary: '클럽 추가',
                description: '클럽 추가',
                response: {
                    201: clubDetailResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const body = request.body as CreateClubType;

            // TODO: JWT에서 실제 userId 추출
            const userId = 1;

            const service = new ClubService(request.server.prisma);
            const result = await service.create(userId, body);

            return reply.status(201).send({ data: result });
        }
    );

    fastify.put(
        '/clubs/:entityId',
        {
            schema: {
                params: idParamJson,
                body: updateClubJson,
                tags: ['Clubs'],
                summary: '클럽 수정',
                description: '클럽 수정',
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
            const body = request.body as UpdateClubType;

            // TODO: JWT에서 실제 userId 추출
            const userId = 1;

            const service = new ClubService(request.server.prisma);
            const result = await service.update(entityId, userId, body);

            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/clubs/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Clubs'],
                summary: '클럽 삭제',
                description: '클럽 삭제',
                response: {
                    204: { type: 'null', description: '삭제 성공' },
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

            // TODO: JWT에서 실제 userId 추출
            const userId = 1;

            const service = new ClubService(request.server.prisma);
            await service.delete(entityId, userId);

            return reply.status(204).send();
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

            // TODO: JWT에서 실제 userId 추출
            const userId = 1;

            const service = new ClubService(request.server.prisma);
            const result = await service.toggleFavorite(entityId, userId);

            return reply.send({ data: result });
        }
    );
}
