import { FastifyInstance } from 'fastify';
import { ClubService } from '../services/club.service.js';
import {
    createClubSchema,
    updateClubSchema,
    getClubSchema,
    getClubsSchema,
    toggleFavoriteSchema,
} from '../schemas/club.schema.js';
import type { CreateClubDto, UpdateClubDto } from '../dto/club.dto.js';

export async function clubRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/clubs',
        {
            schema: {
                ...getClubsSchema,
                tags: ['Clubs'],
                summary: '클럽 목록 조회',
                description: '클럽 목록 조회',
            },
        },
        async (request) => {
            const { offset = 0, limit = 20 } = request.query as { offset?: number; limit?: number };
            const service = new ClubService(request.server.prisma);
            return service.getAll(offset, limit);
        }
    );

    fastify.get(
        '/clubs/:id',
        {
            schema: {
                ...getClubSchema,
                tags: ['Clubs'],
                summary: '클럽 상세 조회',
                description: '클럽 상세 조회',
            },
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const service = new ClubService(request.server.prisma);
            const club = await service.getById(parseInt(id));

            if (!club) {
                return reply.code(404).send({ error: 'Club not found' });
            }

            return club;
        }
    );

    fastify.post(
        '/clubs',
        {
            schema: {
                ...createClubSchema,
                tags: ['Clubs'],
                summary: '클럽 추가',
                description: '클럽 추가',
            },
        },
        async (request, reply) => {
            const service = new ClubService(request.server.prisma);
            // TODO: JWT에서 실제 userId 추출
            const userId = 1; // 임시
            const club = await service.create(userId, request.body as CreateClubDto);
            return reply.send(club);
        }
    );

    // PUT /clubs/:id - 클럽 수정
    fastify.put(
        '/clubs/:id',
        {
            schema: {
                ...updateClubSchema,
                tags: ['Clubs'],
                summary: '클럽 수정',
                description: '클럽 수정',
            },
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const service = new ClubService(request.server.prisma);
            // TODO: JWT에서 실제 userId 추출
            const userId = 1; // 임시

            try {
                const updated = await service.update(
                    parseInt(id),
                    userId,
                    request.body as UpdateClubDto
                );
                return updated;
            } catch (error: any) {
                if (error.message === 'Club not found') {
                    return reply.code(404).send({ error: 'Club not found' });
                }
                if (error.message === 'Unauthorized') {
                    return reply.code(403).send({ error: 'Unauthorized' });
                }
                throw error;
            }
        }
    );

    // DELETE /clubs/:id - 클럽 삭제
    fastify.delete(
        '/clubs/:id',
        {
            schema: {
                ...getClubSchema,
                tags: ['Clubs'],
                summary: '클럽 삭제',
                description: '클럽 삭제',
            },
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const service = new ClubService(request.server.prisma);
            // TODO: JWT에서 실제 userId 추출
            const userId = 1; // 임시

            try {
                await service.delete(parseInt(id), userId);
            } catch (error: any) {
                if (error.message === 'Club not found') {
                    return reply.code(404).send({ error: 'Club not found' });
                }
                if (error.message === 'Unauthorized') {
                    return reply.code(403).send({ error: 'Unauthorized' });
                }
                throw error;
            }
        }
    );

    fastify.post(
        '/clubs/:id/favorite',
        {
            schema: {
                ...toggleFavoriteSchema,
                tags: ['Clubs'],
                summary: '클럽 즐겨찾기 등록/해제',
                description: '클럽 즐겨찾기 등록/해제',
            },
        },
        async (request, reply) => {
            const { id } = request.params as { id: string };
            const service = new ClubService(request.server.prisma);
            // TODO: JWT에서 실제 userId 추출
            const userId = 1; // 임시

            try {
                const result = await service.toggleFavorite(parseInt(id), userId);
                return result;
            } catch (error: any) {
                if (error.message === 'Club not found') {
                    return reply.code(404).send({ error: 'Club not found' });
                }
                throw error;
            }
        }
    );
}
