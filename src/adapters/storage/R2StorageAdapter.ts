import { IStorageAdapter } from '@/adapters/storage/IStorageAdapter.js';

export class R2StorageAdapter implements IStorageAdapter {
    private bucketName: string;
    private accountId: string;
    private accessKeyId: string;
    private secretAccessKey: string;

    constructor(config: {
        bucketName: string;
        accountId: string;
        accessKeyId: string;
        secretAccessKey: string;
    }) {
        this.bucketName = config.bucketName;
        this.accountId = config.accountId;
        this.accessKeyId = config.accessKeyId;
        this.secretAccessKey = config.secretAccessKey;
    }

    async save(buffer: Buffer, filePath: string): Promise<string> {
        // TODO: R2에 파일 업로드 구현
        throw new Error('R2StorageAdapter not implemented yet');
    }

    async delete(filePath: string): Promise<void> {
        // TODO: R2에서 파일 삭제 구현
        throw new Error('R2StorageAdapter not implemented yet');
    }

    async deleteFolder(folderPath: string): Promise<void> {
        // TODO: R2에서 폴더 삭제 구현 (prefix로 모든 객체 삭제)
        throw new Error('R2StorageAdapter not implemented yet');
    }

    async exists(path: string): Promise<boolean> {
        // TODO: R2에서 파일 존재 확인 구현
        throw new Error('R2StorageAdapter not implemented yet');
    }
}
