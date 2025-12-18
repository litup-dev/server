import { errorResJson, successResJson } from '@/schemas/common.schema.js';
import { createReportJson, CreateReportType } from '@/schemas/report.schema.js';
import { ReportService } from '@/services/report.service.js';
import { parseJwt } from '@/utils/jwt.js';
import { FastifyInstance } from 'fastify';

export async function reportRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/report',
        {
            schema: {
                tags: ['Report'],
                summary: '신고하기',
                description: '사용자 신고를 접수합니다.',
                body: createReportJson,
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { userId } = parseJwt(request.headers);
            const reportInfo = request.body as CreateReportType;
            const service = new ReportService(fastify.prisma);
            const result = await service.createReport(userId, reportInfo);
            return reply.send({ data: result });
        }
    );
}
