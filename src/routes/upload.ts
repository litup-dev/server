import { createStorageAdapter } from '@/adapters/storage/index.js';
import { BadRequestError, NotFoundError } from '@/common/error.js';
import { errorResJson, idParamJson, IdParamType, successResJson } from '@/schemas/common.schema.js';
import { ClubService } from '@/services/club.service.js';
import { PerformanceService } from '@/services/performance.service.js';
import { ReviewService } from '@/services/review.service.js';
import { UserService } from '@/services/user.service.js';
import { MultiFileWithBuffer, UploadedFileInfo, UploadType } from '@/types/file.types.js';
import { FileManager } from '@/utils/fileManager.js';
import { MultipartFile } from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

export async function uploadRoutes(fastify: FastifyInstance) {
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
        '/upload/avatar',
        {
            schema: {
                tags: ['Upload'],
                summary: '아바타 업로드',
                description: '사용자 아바타 이미지를 업로드합니다.',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = 2; // 임시 추출

            const parts = request.parts();

            const fileArray: MultiFileWithBuffer[] = [];
            for await (const part of parts) {
                if (part.type === 'file') {
                    const buffer = await part.toBuffer();
                    fileArray.push({
                        ...part,
                        buffer,
                    });
                }
            }

            if (fileArray.length === 0) {
                throw new BadRequestError('업로드할 파일이 없습니다.');
            }

            try {
                const savedFiles = await handleFileUpload(fileArray, UploadType.AVATAR, userId);
                if (!savedFiles[0]) {
                    throw new Error('파일 저장에 실패했습니다.');
                }
                const service = new UserService(request.server.prisma);
                const result = await service.updateUserAvatar(userId, savedFiles[0].filePath);
                return reply.send({ data: result });
            } catch (error: any) {
                if (error instanceof BadRequestError || error instanceof NotFoundError) {
                    throw error;
                }
                throw new Error(`파일 업로드에 실패하였습니다: ${error.message}`);
            }
        }
    );

    fastify.post(
        '/upload/poster/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Upload'],
                summary: '아바타 업로드',
                description: '사용자 아바타 이미지를 업로드합니다.',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = 1; // 임시 추출
            const { entityId } = request.params as IdParamType;

            const parts = request.parts();
            const fileArray: MultiFileWithBuffer[] = [];

            for await (const part of parts) {
                if (part.type === 'file') {
                    const file = part as MultipartFile;
                    const buffer = await part.toBuffer();
                    fileArray.push({
                        ...part,
                        buffer,
                    } as MultiFileWithBuffer);
                }
            }

            if (fileArray.length === 0) {
                throw new BadRequestError('업로드할 파일이 없습니다.');
            }

            try {
                const savedFiles = await handleFileUpload(fileArray, UploadType.POSTER, entityId);
                const service = new PerformanceService(request.server.prisma);
                const result = await service.savePerformancePosters(userId, entityId, savedFiles);
                return reply.send({ data: result });
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
        '/upload/club-review/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Upload'],
                summary: '클럽 리뷰 이미지 업로드',
                description: '사용자 클럽 리뷰 이미지를 업로드합니다.',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = 1; // 임시 추출
            const { entityId } = request.params as IdParamType;

            const parts = request.parts();
            const fileArray: MultiFileWithBuffer[] = [];
            for await (const part of parts) {
                if (part.type === 'file') {
                    const file = part as MultipartFile;
                    const buffer = await part.toBuffer();
                    fileArray.push({
                        ...part,
                        buffer,
                    } as MultiFileWithBuffer);
                }
            }

            if (fileArray.length === 0) {
                throw new BadRequestError('업로드할 파일이 없습니다.');
            }

            try {
                const savedFiles = await handleFileUpload(
                    fileArray,
                    UploadType.CLUB_REVIEW,
                    entityId
                );

                const service = new ReviewService(request.server.prisma);
                const result = await service.saveReviewImages(userId, entityId, savedFiles);
                return reply.send({ data: result });
            } catch (error: any) {
                try {
                    await fileManager.deleteFolder(UploadType.CLUB_REVIEW, entityId);
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
        '/upload/club/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Upload'],
                summary: '클럽 리뷰 이미지 업로드',
                description: '사용자 클럽 리뷰 이미지를 업로드합니다.',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = 1; // 임시 추출
            const { entityId } = request.params as IdParamType;

            const parts = request.parts();
            const fileArray: MultiFileWithBuffer[] = [];
            for await (const part of parts) {
                if (part.type === 'file') {
                    const file = part as MultipartFile;
                    const buffer = await part.toBuffer();
                    fileArray.push({
                        ...part,
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
