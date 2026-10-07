import { BadRequestError, ConflictError, NotFoundError } from '@/common/error.js';
import { Prisma, PrismaClient } from '@prisma/client';

export const EXTRACT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ExtractStatus = (typeof EXTRACT_STATUSES)[number];

export const EXCLUDE_REASONS = ['공연 아님', '중복', '정보 부족', '기타'] as const;

export interface ApproveExtractInput {
    title: string;
    description: string;
    perform_date: string;
    booking_price: number;
    onsite_price: number;
    booking_url?: string | undefined;
    artists: { name: string }[];
    sns_links: { instagram?: string | undefined }[];
    image_ids: number[];
}

export interface DuplicateCandidate {
    perform_id: number;
    title: string | null;
    artists: { name: string }[] | null;
    perform_date: Date | null;
    is_cancelled: boolean;
    images: { id: number; file_path: string | null; is_main: boolean | null }[];
}

type Tx = Prisma.TransactionClient;

// 입력은 KST 'YYYY-MM-DDTHH:mm'. 서버 TZ 와 무관하게 해석되도록 오프셋을 명시한다
const kstToUtc = (value: string) => {
    const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}+09:00`);
    if (Number.isNaN(date.getTime())) throw new BadRequestError('perform_date 형식이 올바르지 않습니다.');
    return date;
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// 공연 시각이 속한 KST 하루 범위 [00:00, 다음날 00:00)
const kstDayRange = (date: Date) => {
    const kst = new Date(date.getTime() + KST_OFFSET_MS);
    const start = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - KST_OFFSET_MS;
    return { gte: new Date(start), lt: new Date(start + DAY_MS) };
};

export class PerformExtractService {
    constructor(private prisma: PrismaClient) {}

    async list(params: { status: ExtractStatus | 'all'; clubId?: number | undefined; offset: number; limit: number }) {
        const where: Prisma.perform_extract_tmpWhereInput = {
            ...(params.status !== 'all' && { status: params.status }),
            ...(params.clubId !== undefined && { club_id: params.clubId }),
        };

        const [items, total, grouped] = await Promise.all([
            this.prisma.perform_extract_tmp.findMany({
                where,
                skip: params.offset,
                take: params.limit,
                orderBy: [{ perform_date: 'asc' }, { id: 'asc' }],
                include: {
                    club_tb: { select: { name: true } },
                    perform_tmp: {
                        select: {
                            description: true,
                            instagram_shortcode: true,
                            perform_img_tmp: {
                                select: { id: true, file_path: true, original_name: true },
                                orderBy: { id: 'asc' },
                            },
                        },
                    },
                },
            }),
            this.prisma.perform_extract_tmp.count({ where }),
            this.prisma.perform_extract_tmp.groupBy({ by: ['status'], _count: { _all: true } }),
        ]);

        const counts = Object.fromEntries(EXTRACT_STATUSES.map((s) => [s, 0])) as Record<ExtractStatus, number>;
        for (const g of grouped) {
            if ((EXTRACT_STATUSES as readonly string[]).includes(g.status)) {
                counts[g.status as ExtractStatus] = g._count._all;
            }
        }

        const duplicatesByExtractId = await this.findDuplicates(items);

        return {
            items: items.map(({ club_tb, perform_tmp, ...item }) => ({
                ...item,
                club_name: club_tb?.name ?? null,
                tmp: {
                    description: perform_tmp.description,
                    instagram_shortcode: perform_tmp.instagram_shortcode,
                    images: perform_tmp.perform_img_tmp,
                },
                duplicates: duplicatesByExtractId.get(item.id) ?? [],
            })),
            total,
            counts,
        };
    }

    // 같은 클럽 · 같은 KST 날짜에 이미 등록된(삭제되지 않은) 공연을 중복 후보로 붙인다
    private async findDuplicates(items: { id: number; club_id: number; perform_date: Date | null; perform_id: number | null }[]) {
        const targets = items.flatMap((item) =>
            item.perform_date ? [{ item, range: kstDayRange(item.perform_date) }] : []
        );
        const result = new Map<number, DuplicateCandidate[]>();
        if (targets.length === 0) return result;

        const performs = await this.prisma.perform.findMany({
            where: {
                is_deleted: false,
                OR: targets.map(({ item, range }) => ({ club_id: item.club_id, perform_date: range })),
            },
            orderBy: [{ perform_date: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                club_id: true,
                title: true,
                artists: true,
                perform_date: true,
                is_cancelled: true,
                perform_img_tb: {
                    select: { id: true, file_path: true, is_main: true },
                    orderBy: { id: 'asc' },
                },
            },
        });

        for (const { item, range } of targets) {
            const matched = performs.filter(
                (p) =>
                    p.club_id === item.club_id &&
                    p.id !== item.perform_id &&
                    p.perform_date !== null &&
                    p.perform_date >= range.gte &&
                    p.perform_date < range.lt
            );
            result.set(
                item.id,
                matched.map((p) => ({
                    perform_id: p.id,
                    title: p.title,
                    artists: Array.isArray(p.artists) ? (p.artists as { name: string }[]) : null,
                    perform_date: p.perform_date,
                    is_cancelled: p.is_cancelled,
                    images: p.perform_img_tb,
                }))
            );
        }
        return result;
    }

    async getPendingForApproval(id: number, imageIds: number[]) {
        const extract = await this.prisma.perform_extract_tmp.findUnique({
            where: { id },
            include: { perform_tmp: { select: { perform_img_tmp: { select: { id: true } } } } },
        });
        if (!extract) throw new NotFoundError('분석 결과를 찾을 수 없습니다.');
        if (extract.status !== 'pending') throw new ConflictError('이미 승인 또는 제외된 항목입니다.');

        const tmpImageIds = new Set(extract.perform_tmp.perform_img_tmp.map((img) => img.id));
        if (tmpImageIds.size > 0 && imageIds.length === 0) {
            throw new BadRequestError('이미지를 한 장 이상 선택해주세요.');
        }
        if (imageIds.some((imgId) => !tmpImageIds.has(imgId))) {
            throw new BadRequestError('해당 임시 공연의 이미지가 아닙니다.');
        }
        return extract;
    }

    /** deletePerformIds 가 있으면 새 공연 등록과 같은 트랜잭션에서 기존 중복 공연을 소프트 삭제한다 */
    async approve(id: number, data: ApproveExtractInput, deletePerformIds: number[] = []) {
        const extract = await this.getPendingForApproval(id, data.image_ids);

        return this.prisma.$transaction(async (tx) => {
            const deletedPerformIds = await this.softDeleteDuplicates(tx, extract, deletePerformIds);

            const perform = await tx.perform.create({
                data: {
                    club_id: extract.club_id,
                    user_id: 1,
                    title: data.title,
                    description: data.description,
                    perform_date: kstToUtc(data.perform_date),
                    booking_price: data.booking_price,
                    onsite_price: data.onsite_price,
                    ...(data.booking_url !== undefined && { booking_url: data.booking_url }),
                    artists: data.artists,
                    sns_links: data.sns_links,
                    updated_at: new Date(),
                },
            });

            const updated = await tx.perform_extract_tmp.updateMany({
                where: { id, status: 'pending' },
                data: {
                    title: data.title,
                    perform_date: perform.perform_date,
                    booking_price: data.booking_price,
                    onsite_price: data.onsite_price,
                    booking_url: data.booking_url ?? null,
                    artists: data.artists,
                    sns_links: data.sns_links,
                    image_ids: data.image_ids,
                    status: 'approved',
                    perform_id: perform.id,
                    reviewed_at: new Date(),
                    updated_at: new Date(),
                },
            });
            if (updated.count === 0) throw new ConflictError('이미 승인 또는 제외된 항목입니다.');

            await this.syncTmpStatus(tx, extract.tmp_id);

            return { id, tmp_id: extract.tmp_id, perform_id: perform.id, deleted_perform_ids: deletedPerformIds };
        });
    }

    /**
     * 승인과 함께 지울 기존 공연을 소프트 삭제한다. 목록의 duplicates 와 같은 기준(같은 club_id · 같은 KST 날짜)에
     * 속한 공연만 허용한다. 이미 삭제됐거나 없는 id 는 건너뛰고, 실제로 삭제한 id 를 돌려준다
     */
    private async softDeleteDuplicates(
        tx: Tx,
        extract: { club_id: number; perform_date: Date | null },
        requestedIds: number[]
    ) {
        const ids = [...new Set(requestedIds)];
        if (ids.length === 0) return [];

        const range = extract.perform_date ? kstDayRange(extract.perform_date) : null;
        const found = await tx.perform.findMany({
            where: { id: { in: ids } },
            select: { id: true, club_id: true, perform_date: true, is_deleted: true },
        });

        const invalid = found.filter(
            (p) =>
                p.club_id !== extract.club_id ||
                !range ||
                p.perform_date === null ||
                p.perform_date < range.gte ||
                p.perform_date >= range.lt
        );
        if (invalid.length > 0) {
            throw new BadRequestError(
                `삭제할 수 없는 공연입니다(같은 클럽·같은 날 공연이 아님): ${invalid.map((p) => `#${p.id}`).join(', ')}`
            );
        }

        const targetIds = found.filter((p) => !p.is_deleted).map((p) => p.id);
        if (targetIds.length === 0) return [];

        await tx.perform.updateMany({
            where: { id: { in: targetIds }, is_deleted: false },
            data: { is_deleted: true, updated_at: new Date() },
        });
        return targetIds;
    }

    /** 이미지 업로드 실패 시 승인을 되돌려 재시도 가능하게 한다 */
    async revertApproval(id: number, performId: number, tmpId: number, deletedPerformIds: number[] = []) {
        await this.prisma.$transaction(async (tx) => {
            if (deletedPerformIds.length > 0) {
                await tx.perform.updateMany({
                    where: { id: { in: deletedPerformIds } },
                    data: { is_deleted: false, updated_at: new Date() },
                });
            }
            await tx.perform_extract_tmp.update({
                where: { id },
                data: { status: 'pending', perform_id: null, reviewed_at: null, updated_at: new Date() },
            });
            await tx.perform_img_tb.deleteMany({ where: { perform_id: performId } });
            await tx.perform.delete({ where: { id: performId } });
            await this.syncTmpStatus(tx, tmpId);
        });
    }

    async reject(id: number, reason: string) {
        return this.prisma.$transaction(async (tx) => {
            const extract = await tx.perform_extract_tmp.findUnique({ where: { id } });
            if (!extract) throw new NotFoundError('분석 결과를 찾을 수 없습니다.');

            const updated = await tx.perform_extract_tmp.updateMany({
                where: { id, status: 'pending' },
                data: { status: 'rejected', reject_reason: reason, reviewed_at: new Date(), updated_at: new Date() },
            });
            if (updated.count === 0) throw new ConflictError('이미 승인 또는 제외된 항목입니다.');

            await this.syncTmpStatus(tx, extract.tmp_id);

            return { id, status: 'rejected' as const, reject_reason: reason };
        });
    }

    // 게시물 하나가 여러 공연으로 나뉠 수 있어, 남은 pending 이 없을 때만 원본을 처리 완료로 본다
    private async syncTmpStatus(tx: Tx, tmpId: number) {
        const pending = await tx.perform_extract_tmp.count({ where: { tmp_id: tmpId, status: 'pending' } });
        await tx.perform_tmp.update({
            where: { id: tmpId },
            data: { status: pending === 0, updated_at: new Date() },
        });
    }
}
