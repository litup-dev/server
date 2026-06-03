import { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/common/error.js';
import {
    GetNoticesType,
    NoticeListItemType,
    PopupNoticeItemType,
    UpsertNoticeType,
} from '@/schemas/notice.schema.js';

type NoticeOrderBy = Prisma.notice_tbOrderByWithRelationInput;

const parseSort = (sort: GetNoticesType['sort']): NoticeOrderBy[] => {
    switch (sort) {
        case '-createdAt':
            return [{ created_at: 'desc' }, { id: 'desc' }];
        case 'createdAt':
            return [{ created_at: 'asc' }, { id: 'asc' }];
        case '-title':
            return [{ title: 'desc' }, { id: 'desc' }];
        case 'title':
            return [{ title: 'asc' }, { id: 'asc' }];
        default:
            return [{ created_at: 'desc' }, { id: 'desc' }];
    }
};

const toListItem = (row: {
    id: number;
    title: string;
    content: string;
    is_popup: boolean;
    created_at: Date | null;
    updated_at: Date | null;
    user_tb: { id: number; nickname: string | null };
}): NoticeListItemType => ({
    id: row.id,
    title: row.title,
    content: row.content,
    isPopup: row.is_popup,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    author: { id: row.user_tb.id, nickname: row.user_tb.nickname },
});

export class NoticeService {
    constructor(private prisma: PrismaClient) {}

    async getSearch(params: GetNoticesType): Promise<{
        items: NoticeListItemType[];
        total: number;
        offset: number;
        limit: number;
    }> {
        const { keyword, sort, offset, limit } = params;

        const where: Prisma.notice_tbWhereInput = {};
        if (keyword) {
            where.OR = [
                { title: { contains: keyword, mode: 'insensitive' } },
                { content: { contains: keyword, mode: 'insensitive' } },
            ];
        }

        const [rows, total] = await Promise.all([
            this.prisma.notice_tb.findMany({
                where,
                orderBy: parseSort(sort),
                skip: offset,
                take: limit,
                include: {
                    user_tb: { select: { id: true, nickname: true } },
                },
            }),
            this.prisma.notice_tb.count({ where }),
        ]);

        return {
            items: rows.map(toListItem),
            total,
            offset,
            limit,
        };
    }

    async getById(id: number): Promise<NoticeListItemType> {
        const row = await this.prisma.notice_tb.findUnique({
            where: { id },
            include: { user_tb: { select: { id: true, nickname: true } } },
        });
        if (!row) {
            throw new NotFoundError('공지사항을 찾을 수 없습니다.');
        }
        return toListItem(row);
    }

    async getActivePopupNotices(): Promise<PopupNoticeItemType[]> {
        const rows = await this.prisma.notice_tb.findMany({
            where: { is_popup: true },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
            select: { id: true, title: true, content: true, created_at: true },
        });
        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            createdAt: r.created_at ? r.created_at.toISOString() : null,
        }));
    }

    async create(userId: number, dto: UpsertNoticeType): Promise<number> {
        const created = await this.prisma.notice_tb.create({
            data: {
                user_id: userId,
                title: dto.title,
                content: dto.content,
                is_popup: dto.isPopup,
            },
            select: { id: true },
        });
        return created.id;
    }

    async update(id: number, dto: UpsertNoticeType): Promise<void> {
        const exists = await this.prisma.notice_tb.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists) {
            throw new NotFoundError('공지사항을 찾을 수 없습니다.');
        }
        await this.prisma.notice_tb.update({
            where: { id },
            data: {
                title: dto.title,
                content: dto.content,
                is_popup: dto.isPopup,
                updated_at: new Date(),
            },
        });
    }

    async delete(id: number): Promise<void> {
        const exists = await this.prisma.notice_tb.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists) {
            throw new NotFoundError('공지사항을 찾을 수 없습니다.');
        }
        await this.prisma.notice_tb.delete({ where: { id } });
    }
}
