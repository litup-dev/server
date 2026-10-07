import { createStorageAdapter } from '@/adapters/storage/index.js';
import { BadRequestError } from '@/common/error.js';
import {
    EXCLUDE_REASONS,
    EXTRACT_STATUSES,
    PerformExtractService,
} from '@/services/performExtract.service.js';
import { PerformanceService } from '@/services/performance.service.js';
import { UploadedFileInfo, UploadType } from '@/types/file.types.js';
import { FileManager } from '@/utils/fileManager.js';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const MIME_MAP: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
};

const listQuerySchema = z.object({
    status: z.enum([...EXTRACT_STATUSES, 'all']).default('pending'),
    club_id: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().int().positive().optional()),
    offset: z.preprocess((v) => (v !== undefined ? Number(v) : 0), z.number().int().min(0).default(0)),
    limit: z.preprocess((v) => (v !== undefined ? Number(v) : 9), z.number().int().min(1).max(100).default(9)),
});

const idParamSchema = z.object({
    id: z.preprocess((v) => Number(v), z.number().int().positive()),
});

const approveSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    perform_date: z.string().min(1),
    booking_price: z.number().int().min(0).default(0),
    onsite_price: z.number().int().min(0).default(0),
    booking_url: z.string().url().optional(),
    artists: z.array(z.object({ name: z.string().min(1) })),
    sns_links: z.array(z.object({ instagram: z.string().optional() })).default([]),
    image_ids: z.array(z.number().int().positive()).default([]),
});

const approveWithDeleteSchema = approveSchema.extend({
    delete_perform_ids: z.array(z.number().int().positive()).min(1),
});

const rejectSchema = z.object({
    reason: z.enum(EXCLUDE_REASONS),
});

const parseOrThrow = <T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
        throw new BadRequestError(parsed.error.errors.map((e) => e.message).join(', '));
    }
    return parsed.data;
};

export async function internalPerformExtractRoutes(fastify: FastifyInstance) {
    const fileManager = new FileManager(createStorageAdapter());

    fastify.get(
        '/internal/performances/extract',
        { preHandler: [fastify.requireInternal], schema: { hide: true } },
        async (request, reply) => {
            const query = parseOrThrow(listQuerySchema, request.query);
            const service = new PerformExtractService(request.server.prisma);
            const result = await service.list({
                status: query.status,
                clubId: query.club_id,
                offset: query.offset,
                limit: query.limit,
            });
            return reply.send(result);
        }
    );

    // 승인 + 이미지 업로드. 업로드 실패 시 승인(과 함께 삭제한 기존 공연)을 되돌린다
    const approveWithImages = async (
        request: FastifyRequest,
        id: number,
        body: z.infer<typeof approveSchema>,
        deletePerformIds: number[]
    ) => {
        const service = new PerformExtractService(request.server.prisma);
        const { tmp_id, perform_id, deleted_perform_ids } = await service.approve(id, body, deletePerformIds);

        if (body.image_ids.length === 0) {
            return { response: { id, status: 'approved', perform_id, images: [] }, deleted_perform_ids };
        }

        try {
            const tmpImages = await request.server.prisma.perform_img_tmp.findMany({
                where: { id: { in: body.image_ids }, perform_id: tmp_id },
                select: { id: true, file_path: true, original_name: true },
            });
            const ordered = body.image_ids
                .map((imgId) => tmpImages.find((img) => img.id === imgId))
                .filter((img): img is NonNullable<typeof img> => img != null);

            const files: UploadedFileInfo[] = await Promise.all(
                ordered.map(async (img) => {
                    const filePath = img.file_path ?? '';
                    const buffer = await fs.readFile(filePath);
                    const ext = path.extname(filePath).toLowerCase();
                    return {
                        buffer,
                        fileName: img.original_name ?? path.basename(filePath),
                        mimeType: MIME_MAP[ext] ?? 'image/jpeg',
                        encoding: 'binary',
                        size: buffer.length,
                    };
                })
            );

            const savedFiles = await fileManager.savefiles(files, UploadType.POSTER, perform_id);
            await new PerformanceService(request.server.prisma).savePerformancePosters(1, perform_id, savedFiles);

            return {
                response: {
                    id,
                    status: 'approved',
                    perform_id,
                    images: savedFiles.map((f) => ({
                        perform_id,
                        url: f.filePath,
                        is_main: f.order === 0,
                        order: f.order,
                    })),
                },
                deleted_perform_ids,
            };
        } catch (error: any) {
            try {
                await fileManager.deleteFolder(UploadType.POSTER, perform_id);
            } catch (rollbackError) {
                request.log.error(rollbackError, '자동화 승인 이미지 폴더 삭제 실패');
            }
            await service.revertApproval(id, perform_id, tmp_id, deleted_perform_ids);
            throw new Error(`이미지 업로드에 실패해 승인을 되돌렸습니다: ${error.message}`);
        }
    };

    // 기존 승인 API — 응답/동작 변경 없음
    fastify.post(
        '/internal/performances/extract/:id/approve',
        { preHandler: [fastify.requireInternal], schema: { hide: true } },
        async (request, reply) => {
            const { id } = parseOrThrow(idParamSchema, request.params);
            const body = parseOrThrow(approveSchema, request.body);

            const { response } = await approveWithImages(request, id, body, []);
            return reply.code(201).send(response);
        }
    );

    // 승인 + 기존 중복 공연 소프트 삭제 (한 트랜잭션)
    fastify.post(
        '/internal/performances/extract/:id/approve-with-delete',
        { preHandler: [fastify.requireInternal], schema: { hide: true } },
        async (request, reply) => {
            const { id } = parseOrThrow(idParamSchema, request.params);
            const { delete_perform_ids, ...body } = parseOrThrow(approveWithDeleteSchema, request.body);

            const { response, deleted_perform_ids } = await approveWithImages(request, id, body, delete_perform_ids);
            return reply.code(201).send({ ...response, deleted_perform_ids });
        }
    );

    fastify.post(
        '/internal/performances/extract/:id/reject',
        { preHandler: [fastify.requireInternal], schema: { hide: true } },
        async (request, reply) => {
            const { id } = parseOrThrow(idParamSchema, request.params);
            const { reason } = parseOrThrow(rejectSchema, request.body);
            const service = new PerformExtractService(request.server.prisma);
            return reply.send(await service.reject(id, reason));
        }
    );
}
