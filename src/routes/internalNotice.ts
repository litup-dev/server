import { FastifyInstance } from 'fastify';
import { BadRequestError } from '@/common/error.js';
import { NoticeService } from '@/services/notice.service.js';
import {
    noticeCreatedResJson,
    upsertNoticeJson,
    upsertNoticeSchema,
} from '@/schemas/notice.schema.js';
import {
    errorResJson,
    idParamJson,
    idParamSchema,
    successResJson,
} from '@/schemas/common.schema.js';

// 백오피스 부재로 작성자(user_id)는 1로 하드코딩.
// DB 컬럼 default 가 아니라 핸들러에서 명시한다.
const HARDCODED_AUTHOR_USER_ID = 1;

export async function internalNoticeRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/internal/notice',
        {
            preHandler: [fastify.requireInternal],
            schema: {
                hide: true,
                body: upsertNoticeJson,
                tags: ['Internal'],
                summary: '공지사항 등록 (internal)',
                response: {
                    200: noticeCreatedResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const parsed = upsertNoticeSchema.safeParse(request.body);
            if (!parsed.success) {
                throw new BadRequestError(parsed.error.errors.map((e) => e.message).join(', '));
            }
            const service = new NoticeService(request.server.prisma);
            const id = await service.create(HARDCODED_AUTHOR_USER_ID, parsed.data);
            return reply.send({ data: { id } });
        },
    );

    fastify.put(
        '/internal/notice/:entityId',
        {
            preHandler: [fastify.requireInternal],
            schema: {
                hide: true,
                params: idParamJson,
                body: upsertNoticeJson,
                tags: ['Internal'],
                summary: '공지사항 수정 (internal)',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const idParsed = idParamSchema.safeParse(request.params);
            if (!idParsed.success) {
                throw new BadRequestError(
                    `허용되지 않은 파라미터입니다. ${idParsed.error.message}`,
                );
            }
            const bodyParsed = upsertNoticeSchema.safeParse(request.body);
            if (!bodyParsed.success) {
                throw new BadRequestError(
                    bodyParsed.error.errors.map((e) => e.message).join(', '),
                );
            }
            const service = new NoticeService(request.server.prisma);
            await service.update(idParsed.data.entityId, bodyParsed.data);
            return reply.send({
                data: { success: true, operation: 'updated' },
            });
        },
    );

    fastify.delete(
        '/internal/notice/:entityId',
        {
            preHandler: [fastify.requireInternal],
            schema: {
                hide: true,
                params: idParamJson,
                tags: ['Internal'],
                summary: '공지사항 삭제 (internal)',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(
                    `허용되지 않은 파라미터입니다. ${parsed.error.message}`,
                );
            }
            const service = new NoticeService(request.server.prisma);
            await service.delete(parsed.data.entityId);
            return reply.send({
                data: { success: true, operation: 'deleted' },
            });
        },
    );
}
