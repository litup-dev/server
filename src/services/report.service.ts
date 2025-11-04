import { NotFoundError } from '@/common/error.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import { CreateReportType } from '@/schemas/report.schema.js';
import { PrismaClient } from '@prisma/client';

export class ReportService {
    constructor(private prisma: PrismaClient) {}

    async isEntityExist(type: string | null, entityId: number): Promise<boolean> {
        if (type === null) {
            throw new NotFoundError('신고 유형의 코드 값이 없습니다.');
        }
        let isExist = null;
        switch (type.toLowerCase()) {
            case 'post':
                // 게시글 -> 커뮤 기능 추가 시
                return false;
            case 'comment':
                // 댓글 -> 커뮤 기능 추가 시
                return false;
            case 'review':
                isExist = await this.prisma.club_review_tb.findUnique({
                    where: { id: entityId },
                });
                return isExist !== null;
            case 'one_line_review':
                isExist = await this.prisma.club_review_tb.findUnique({
                    where: { id: entityId },
                });
                return isExist !== null;
            case 'user':
                isExist = await this.prisma.user_tb.findUnique({
                    where: { id: entityId },
                });
                return isExist !== null;
            default:
                return false;
        }
    }

    async createReport(
        userId: number,
        reportInfo: CreateReportType
    ): Promise<OperationSuccessType> {
        const { typeId, categoryId, entityId, content } = reportInfo;

        // 요청 타입 조회
        const reportType = await this.prisma.report_type_code
            .findFirstOrThrow({
                where: { id: typeId },
            })
            .catch(() => {
                throw new NotFoundError('신고 유형이 존재하지 않습니다.');
            });
        // 엔티티 조회
        const entityExists = await this.isEntityExist(reportType.code, entityId);
        if (!entityExists) {
            throw new NotFoundError('신고 대상 엔티티가 존재하지 않습니다.');
        }

        // 신고 상태값 조회
        const reportStatus = await this.prisma.report_status_code
            .findFirstOrThrow({
                where: { code: 'pending' },
            })
            .catch(() => {
                throw new NotFoundError('상태값이 존재하지 않습니다.');
            });

        await this.prisma.report_tb.create({
            data: {
                user_id: userId,
                type_id: typeId,
                category_id: categoryId,
                entity_id: entityId,
                content: content || null,
                status_id: reportStatus.id,
            },
        });

        return {
            success: true,
            operation: 'created',
            message: '신고가 접수되었습니다.',
        };
    }
}
