import { IStorageAdapter } from '@/adapters/storage/IStorageAdapter.js';
import path from 'path';
import { promises as fstat } from 'fs';

export class LocalStorageAdapter implements IStorageAdapter {
    private basePath: string;

    constructor(basePath: string = './images') {
        this.basePath = basePath;
    }

    async save(buffer: Buffer, filePath: string): Promise<string> {
        const fullPath = path.join(this.basePath, filePath);
        const dirPath = path.dirname(fullPath);

        await fstat.mkdir(dirPath, { recursive: true });
        await fstat.writeFile(fullPath, buffer);
        return fullPath;
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = path.join(this.basePath, filePath);

        try {
            await fstat.unlink(fullPath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw new Error(`파일 삭제에 실패하였습니다.: ${error.message}`);
            }
        }
    }

    async deleteFolder(folderPath: string): Promise<void> {
        const fullPath = path.join(this.basePath, folderPath);

        try {
            await fstat.rm(fullPath, { recursive: true, force: true });
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw new Error(`폴더 삭제에 실패하였습니다.: ${error.message}`);
            }
        }
    }

    async exists(filePath: string): Promise<boolean> {
        const fullPath = path.join(this.basePath, filePath);

        try {
            await fstat.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }
}
