import { createStorageAdapter } from '@/adapters/storage/index.js';
import { BadRequestError, NotFoundError } from '@/common/error.js';
import { errorResJson, idParamJson, IdParamType, successResJson } from '@/schemas/common.schema.js';
import { ClubService } from '@/services/club.service.js';
import { PerformanceService } from '@/services/performance.service.js';
import { MultiFileWithBuffer, UploadedFileInfo, UploadType } from '@/types/file.types.js';
import { FileManager } from '@/utils/fileManager.js';
import { MultipartFile } from '@fastify/multipart';
import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const MIME_MAP: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
};

const uploadFromTmpSchema = z.object({
    tmp_image_ids: z.array(z.number().int().positive()).min(1),
    tmp_perform_id: z.number().int().positive(),
});

export async function internalUploadRoutes(fastify: FastifyInstance) {
    const fileManager = new FileManager(createStorageAdapter());

    async function handleFileUpload(
        files: MultiFileWithBuffer[],
        type: UploadType,
        entityId: number
    ) {
        const uploadedFiles: UploadedFileInfo[] = files.map((item) => ({
            buffer: item.buffer,
            fileName: item.filename,
            mimeType: item.mimetype,
            encoding: item.encoding,
            size: item.buffer.length,
        }));

        const savedFiles = await fileManager.savefiles(uploadedFiles, type, entityId);

        return savedFiles;
    }

    fastify.post(
        '/internal/upload/poster/:entityId',
        {
            preHandler: [fastify.requireInternal],
            schema: { hide: true, params: idParamJson },
        },
        async (request, reply) => {
            const { entityId } = request.params as IdParamType;

            const parsed = uploadFromTmpSchema.safeParse(request.body);
            if (!parsed.success) {
                throw new BadRequestError(parsed.error.errors.map((e) => e.message).join(', '));
            }

            const { tmp_image_ids, tmp_perform_id } = parsed.data;

            const tmpImages = await request.server.prisma.perform_img_tmp.findMany({
                where: { id: { in: tmp_image_ids }, perform_id: tmp_perform_id },
                select: { id: true, file_path: true, original_name: true },
            });

            const ordered = tmp_image_ids
                .map((id) => tmpImages.find((img) => img.id === id))
                .filter((img): img is NonNullable<typeof img> => img != null);

            if (ordered.length === 0) {
                throw new BadRequestError('유효한 임시 이미지를 찾을 수 없습니다.');
            }

            const uploadedFiles: UploadedFileInfo[] = await Promise.all(
                ordered.map(async (img) => {
                    const filePath = img.file_path ?? '';
                    const buffer = await fs.readFile(filePath);
                    const ext = path.extname(filePath).toLowerCase();
                    const mimeType = MIME_MAP[ext] ?? 'image/jpeg';
                    const fileName = img.original_name ?? path.basename(filePath);
                    return { buffer, fileName, mimeType, encoding: 'binary', size: buffer.length };
                })
            );

            try {
                const savedFiles = await fileManager.savefiles(uploadedFiles, UploadType.POSTER, entityId);
                const service = new PerformanceService(request.server.prisma);
                await service.savePerformancePosters(1, entityId, savedFiles);
                return reply.code(201).send({
                    images: savedFiles.map((f) => ({
                        perform_id: entityId,
                        url: f.filePath,
                        is_main: f.order === 0,
                        order: f.order,
                    })),
                });
            } catch (error: any) {
                try {
                    await fileManager.deleteFolder(UploadType.POSTER, entityId);
                } catch (rollbackError) {
                    console.error('업로드 실패로 인한 폴더 삭제 중 오류 발생:', rollbackError);
                }

                if (error instanceof BadRequestError || error instanceof NotFoundError) {
                    throw error;
                }

                throw new Error(`파일 업로드에 실패하였습니다: ${error.message}`);
            }
        }
    );

    fastify.post(
        '/internal/upload/club/:entityId',
        {
            schema: {
                hide: true,
                params: idParamJson,
                tags: ['Upload'],
                summary: '클럽 이미지 업로드',
                description: '클럽 이미지를 업로드합니다.',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = 1;
            const { entityId } = request.params as IdParamType;

            const parts = request.parts();
            const fileArray: MultiFileWithBuffer[] = [];
            for await (const part of parts) {
                if (part.type === 'file') {
                    const file = part as MultipartFile;
                    const buffer = await part.toBuffer();
                    fileArray.push({
                        ...file,
                        buffer,
                    } as MultiFileWithBuffer);
                }
            }

            if (fileArray.length === 0) {
                throw new BadRequestError('업로드할 파일이 없습니다.');
            }

            try {
                const savedFiles = await handleFileUpload(fileArray, UploadType.CLUB, entityId);
                const service = new ClubService(request.server.prisma);
                const result = await service.saveClubImages(userId, entityId, savedFiles);

                return reply.send({ data: result });
            } catch (error: any) {
                try {
                    await fileManager.deleteFolder(UploadType.CLUB, entityId);
                } catch (rollbackError) {
                    console.error('업로드 실패로 인한 폴더 삭제 중 오류 발생:', rollbackError);
                }

                if (error instanceof BadRequestError || error instanceof NotFoundError) {
                    throw error;
                }
                throw new Error(`파일 업로드에 실패하였습니다: ${error.message}`);
            }
        }
    );
}
