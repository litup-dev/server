import { MultipartFile } from '@fastify/multipart';

export interface MultiFileWithBuffer extends MultipartFile {
    buffer: Buffer;
}
export enum UploadType {
    AVATAR = 'AVATAR',
    POSTER = 'POSTER',
    CLUB_REVIEW = 'CLUB_REVIEW',
    CLUB = 'CLUB',
    POST = 'POST',
}

export interface UploadConfig {
    type: UploadType;
    minFiles: number;
    maxFiles: number;
    folderName: string;
    /** 설정하면 긴 변이 이 값(px)을 넘는 이미지를 줄여 저장한다. */
    maxDimension?: number;
    /** 설정하면 이 가로(px)의 목록용 썸네일(WebP)을 함께 저장한다. */
    thumbnailWidth?: number;
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
    /** 목록용 썸네일 경로. 썸네일을 만들지 않는 타입이면 없다. */
    thumbPath?: string;
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
        maxFiles: 20,
        folderName: 'poster',
        maxDimension: 2048,
        thumbnailWidth: 640,
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
    // 게시글 이미지는 에디터에서 글 저장 전에 한 장씩 선업로드된다.
    // 폴더는 유저 단위(post/{userId})이며 글당 최대 개수(10)는 글 저장 시점에 서비스에서 검증한다.
    [UploadType.POST]: {
        type: UploadType.POST,
        minFiles: 1,
        maxFiles: 10,
        folderName: 'post',
    },
};
