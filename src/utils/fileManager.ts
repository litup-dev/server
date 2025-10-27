import { IStorageAdapter } from '@/adapters/storage';
import { BadRequestError } from '@/common/error.js';
import { SavedFileInfo, UPLOAD_CONFIGS, UploadedFileInfo, UploadType } from '@/types/file.types.js';
import moment from 'moment';
import { randomUUID } from 'crypto';
import path from 'path';
import { get } from 'http';
import { getCompactKoreaTimestamp } from './time';

export class FileManager {
    private storage: IStorageAdapter;
    private allowedMimeTypes: string[];
    private maxFileSize: number;

    constructor(storage: IStorageAdapter) {
        this.storage = storage;
        this.allowedMimeTypes = process.env.ALLOWED_IMAGE_MIME
            ? process.env.ALLOWED_IMAGE_MIME.split(',')
            : ['image/png', 'image/jpeg', 'image/webp'];
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
    }

    /**
     * 파일 검증
     * @param file 업로드한 파일
     */
    validateFile(file: UploadedFileInfo): void {
        // MIME 타입
        if (!this.allowedMimeTypes.includes(file.mimeType)) {
            throw new BadRequestError(`허용되지 않는 파일 형식입니다: ${file.mimeType}`);
        }

        // 파일 크기
        if (file.size > this.maxFileSize) {
            throw new BadRequestError(
                `파일 크기가 너무 큽니다. 최대 허용 크기: ${this.maxFileSize} bytes`
            );
        }
    }

    /**
     * 파일명 생성
     * @param originalName 원본 파일명
     * @returns 저장할 파일명
     */
    generateFileName(originalName: string): string {
        const ext = path.extname(originalName);
        const timestamp = getCompactKoreaTimestamp();
        const uuid = randomUUID();
        return `${timestamp}_${uuid}${ext}`;
    }

    /**
     * 업로드 경로
     * @param type 업로드 타입(예: avatar, poster, club_review)
     * @param entityId 엔티티 ID -> 파일의 부모 폴더 명으로 사용됨
     * @returns 업로드 경로
     */
    getUploadPath(type: UploadType, entityId: string | number): string {
        const config = UPLOAD_CONFIGS[type];
        return `${config.folderName}/${entityId}`;
    }

    /**
     * 파일 개수 검증
     * @param files 업로드한 파일들
     * @param type 업로드 타입
     */
    validateFileCount(files: UploadedFileInfo[], type: UploadType): void {
        const config = UPLOAD_CONFIGS[type];
        if (files.length < config.minFiles) {
            throw new BadRequestError(`최소 ${config.minFiles}개의 파일을 업로드해야 합니다.`);
        }

        if (files.length > config.maxFiles) {
            throw new BadRequestError(`최대 ${config.maxFiles}개의 파일만 업로드할 수 있습니다.`);
        }
    }

    /**
     * 다건 파일 저장
     */
    async savefiles(
        files: UploadedFileInfo[],
        type: UploadType,
        entityId: string | number
    ): Promise<SavedFileInfo[]> {
        // 파일 개수 검증
        this.validateFileCount(files, type);

        // 파일 검증
        files.forEach((file) => this.validateFile(file));

        // 기존 폴더 삭제
        // 한장씩 수정가능하게 두는 것보다 업로드 시 기존 사진을 삭제하며 관리하는 편이 좋을 듯함.
        // 사용자가 리뷰 수정 시 기존 이미지가 날아가는 단점이 있음.
        const folderPath = this.getUploadPath(type, entityId);
        await this.storage.deleteFolder(folderPath);

        // 파일 저장
        const savedFiles: SavedFileInfo[] = [];
        for (const file of files) {
            const storedName = this.generateFileName(file.fileName);
            const filePath = `${folderPath}/${storedName}`;

            try {
                await this.storage.save(file.buffer, filePath);
                savedFiles.push({
                    originalName: file.fileName,
                    storedName,
                    filePath,
                    size: file.size,
                    mimeType: file.mimeType,
                });
            } catch (error: any) {
                await this.rollbackFiles(savedFiles);
                throw new Error(`파일 저장에 실패하였습니다: ${error.message}`);
            }
        }

        return savedFiles;
    }

    private async rollbackFiles(files: SavedFileInfo[]): Promise<void> {
        for (const file of files) {
            try {
                await this.storage.delete(file.filePath);
            } catch (error) {
                throw new Error(`파일 롤백에 실패하였습니다: ${error}`);
            }
        }
    }

    async deleteFolder(type: UploadType, entityId: number | string): Promise<void> {
        const folderPath = this.getUploadPath(type, entityId);
        await this.storage.deleteFolder(folderPath);
    }
}
