import { MultipartFile } from '@fastify/multipart';

export interface MultiFileWithBuffer extends MultipartFile {
    buffer: Buffer;
}
export enum UploadType {
    AVATAR = 'AVATAR',
    POSTER = 'POSTER',
    CLUB_REVIEW = 'CLUB_REVIEW',
    CLUB = 'CLUB',
}

export interface UploadConfig {
    type: UploadType;
    minFiles: number;
    maxFiles: number;
    folderName: string;
}

export interface UploadedFileInfo {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    encoding: string;
    size: number;
}

export interface SavedFileInfo {
    originalName: string;
    storedName: string;
    filePath: string;
    size: number;
    mimeType: string;
    order?: number;
}

export const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
    [UploadType.AVATAR]: {
        type: UploadType.AVATAR,
        minFiles: 1,
        maxFiles: 1,
        folderName: 'avatar',
    },
    [UploadType.POSTER]: {
        type: UploadType.POSTER,
        minFiles: 1,
        maxFiles: 5,
        folderName: 'poster',
    },
    [UploadType.CLUB_REVIEW]: {
        type: UploadType.CLUB_REVIEW,
        minFiles: 1,
        maxFiles: 3,
        folderName: 'review',
    },
    [UploadType.CLUB]: {
        type: UploadType.CLUB,
        minFiles: 1,
        maxFiles: 5,
        folderName: 'club',
    },
};
