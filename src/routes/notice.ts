import { FastifyInstance } from 'fastify';
import { NoticeService } from '@/services/notice.service.js';
import {
    getNoticesJson,
    GetNoticesType,
    noticeDetailResJson,
    noticeListResJson,
    popupNoticesResJson,
} from '@/schemas/notice.schema.js';
import { idParamSchema, idParamJson, errorResJson } from '@/schemas/common.schema.js';
import { BadRequestError } from '@/common/error.js';

export async function noticeRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/notices',
        {
            schema: {
                querystring: getNoticesJson,
                tags: ['Notices'],
                summary: '공지사항 목록 조회',
                description: '제목/내용 검색, 등록일/제목 정렬, 페이지네이션 지원',
                response: {
                    200: noticeListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetNoticesType;
            const service = new NoticeService(request.server.prisma);
            const result = await service.getSearch(query);
            return reply.send({ data: result });
        },
    );

    fastify.get(
        '/notices/popup',
        {
            schema: {
                tags: ['Notices'],
                summary: '메인 팝업 공지 목록',
                description: 'is_popup=true 인 공지를 최신순으로 모두 반환 (다시보지않기 처리는 클라이언트)',
                response: {
                    200: popupNoticesResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const service = new NoticeService(request.server.prisma);
            const items = await service.getActivePopupNotices();
            return reply.send({ data: { items } });
        },
    );

    fastify.get(
        '/notices/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Notices'],
                summary: '공지사항 상세 조회',
                description: '공지사항 단건 조회',
                response: {
                    200: noticeDetailResJson,
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
            const { entityId } = parsed.data;
            const service = new NoticeService(request.server.prisma);
            const result = await service.getById(entityId);
            return reply.send({ data: result });
        },
    );
}
