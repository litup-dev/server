import { IStorageAdapter } from '@/adapters/storage/IStorageAdapter.js';
import { NotFoundError } from '@/common/error.js';
import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import path from 'path/win32';

export class R2StorageAdapter implements IStorageAdapter {
    private client: S3Client;
    private bucketName: string;

    constructor(config: {
        bucketName: string;
        accountId: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3EndpointUrl: string;
    }) {
        this.bucketName = config.bucketName;
        this.client = new S3Client({
            region: 'auto',
            endpoint: config.s3EndpointUrl,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }

    async save(buffer: Buffer, filePath: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filePath,
            Body: buffer,
            ContentType: this.getContentType(filePath),
        });
        await this.client.send(command);
        return filePath;
    }

    async delete(filePath: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: filePath,
        });

        await this.client.send(command);
    }

    async deleteFolder(folderPath: string): Promise<void> {
        const listCommand = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: folderPath.endsWith('/') ? folderPath : `${folderPath}/`,
        });

        const listedObjects = await this.client.send(listCommand);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            throw new NotFoundError('파일을 찾을 수 없습니다.');
        }

        const deleteCommand = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
                Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key })),
            },
        });

        await this.client.send(deleteCommand);
    }

    async exists(path: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: path,
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw error;
        }
    }

    private getContentType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        const contentTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
        };
        return contentTypes[ext || ''] || 'application/octet-stream';
    }
}
