import { createStorageAdapter } from '@/adapters/storage/index.js';
import { BadRequestError, NotFoundError } from '@/common/error.js';
import { createClubJson, createClubSchema } from '@/schemas/club.schema';
import { errorResJson, idParamJson, IdParamType, successResJson } from '@/schemas/common.schema.js';
import { ClubService } from '@/services/club.service.js';
import { PerformanceService } from '@/services/performance.service.js';
import { ReviewService } from '@/services/review.service.js';
import { UserService } from '@/services/user.service.js';
import { MultiFileWithBuffer, UploadedFileInfo, UploadType } from '@/types/file.types.js';
import { FileManager } from '@/utils/fileManager.js';
import { MultipartFile } from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

export async function internalClubRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/internal/club',
        {
            preHandler: [fastify.requireInternal],
            schema: {
                hide: true,
                // body: createClubJson,
                tags: ['Upload'],
                summary: '클럽 등록',
                description: '클럽 정보를 등록합니다.',
                response: {
                    // 200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = 1;
            const parts = request.parts();
            const fields: Record<string, string> = {};

            for await (const part of parts) {
                if (part.type === 'field') {
                    fields[part.fieldname] = part.value as string;
                }
            }

            const parsed = createClubSchema.safeParse(fields);
            if (!parsed.success) {
                throw new BadRequestError(parsed.error.errors.map((e) => e.message).join(', '));
            }

            const service = new ClubService(request.server.prisma);
            const clubId = await service.createClub(userId, parsed.data);

            return reply.send({ data: { id: clubId } });
        }
    );
}
