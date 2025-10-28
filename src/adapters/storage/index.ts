import type { IStorageAdapter } from './IStorageAdapter.js';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';
import { R2StorageAdapter } from './R2StorageAdapter.js';

export type StorageType = 'local' | 'r2';

export function createStorageAdapter(type?: StorageType): IStorageAdapter {
    const storageType = type || (process.env.STORAGE_TYPE as StorageType) || 'local';

    switch (storageType) {
        case 'local':
            return new LocalStorageAdapter(process.env.UPLOAD_PATH || './images');
        case 'r2':
            return new R2StorageAdapter({
                bucketName: process.env.R2_BUCKET_NAME || '',
                accountId: process.env.R2_ACCOUNT_ID || '',
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
                s3EndpointUrl: process.env.R2_S3_ENDPOINT_URL || '',
            });
        default:
            throw new Error(`지원되지 않는 스토리지 타입입니다: ${storageType}`);
    }
}

export { IStorageAdapter, LocalStorageAdapter, R2StorageAdapter };
