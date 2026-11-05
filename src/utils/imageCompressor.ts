import { BadRequestError } from '@/common/error.js';
import { UploadedFileInfo } from '@/types/file.types.js';
import path from 'path';
import sharp from 'sharp';

// 용량 초과 시 순서대로 시도한다. 긴 변 기준 px, 앞쪽(큰 해상도 + 높은 품질)일수록 화질 우선.
const MAX_DIMENSIONS = [2048, 1600, 1280];
const QUALITIES = [85, 80, 75, 70];

/**
 * 이미지가 maxBytes를 넘으면 해상도/품질을 낮춰 maxBytes 이하로 줄인다. (원본은 보관하지 않는다)
 * - maxBytes 이하이면 원본을 그대로 반환한다.
 * - JPEG → JPEG(mozjpeg), PNG/WebP → WebP(투명도 유지)
 * - EXIF 회전을 픽셀에 반영하고 메타데이터는 제거한다.
 * - 끝까지 줄이지 못하면 가장 작은 결과를 반환하며, 이후 FileManager.validateFile 이 거절한다.
 */
export async function compressImageIfNeeded(
    file: UploadedFileInfo,
    maxBytes: number
): Promise<UploadedFileInfo> {
    if (file.buffer.length <= maxBytes) {
        return file;
    }

    const asJpeg = file.mimeType === 'image/jpeg';
    const mimeType = asJpeg ? 'image/jpeg' : 'image/webp';

    let smallest: Buffer | undefined;
    try {
        for (const dimension of MAX_DIMENSIONS) {
            for (const quality of QUALITIES) {
                const pipeline = sharp(file.buffer)
                    .rotate()
                    .resize({
                        width: dimension,
                        height: dimension,
                        fit: 'inside',
                        withoutEnlargement: true,
                    });
                const out = await (asJpeg
                    ? pipeline.jpeg({ quality, mozjpeg: true })
                    : pipeline.webp({ quality })
                ).toBuffer();

                if (!smallest || out.length < smallest.length) {
                    smallest = out;
                }
                if (out.length <= maxBytes) {
                    return withBuffer(file, out, mimeType);
                }
            }
        }
    } catch (error: any) {
        throw new BadRequestError(`이미지를 처리할 수 없습니다: ${error.message}`);
    }

    return withBuffer(file, smallest ?? file.buffer, mimeType);
}

const DIMENSION_QUALITY = 85;
const THUMBNAIL_QUALITY = 80;

/**
 * 긴 변이 maxDimension(px)을 넘는 이미지를 비율을 유지해 줄인다. (원본은 보관하지 않는다)
 * - 이미 maxDimension 이하이면 다시 인코딩하지 않고 원본을 그대로 반환한다. (화질 손실 방지)
 * - JPEG → JPEG(mozjpeg), PNG/WebP → WebP. EXIF 회전을 픽셀에 반영하고 메타데이터는 제거한다.
 */
export async function limitImageDimension(
    file: UploadedFileInfo,
    maxDimension: number
): Promise<UploadedFileInfo> {
    try {
        const { width = 0, height = 0 } = await sharp(file.buffer).metadata();
        // 긴 변은 EXIF 회전으로 가로/세로가 바뀌어도 같다.
        if (Math.max(width, height) <= maxDimension) {
            return file;
        }

        const asJpeg = file.mimeType === 'image/jpeg';
        const pipeline = sharp(file.buffer)
            .rotate()
            .resize({
                width: maxDimension,
                height: maxDimension,
                fit: 'inside',
                withoutEnlargement: true,
            });
        const out = await (asJpeg
            ? pipeline.jpeg({ quality: DIMENSION_QUALITY, mozjpeg: true })
            : pipeline.webp({ quality: DIMENSION_QUALITY })
        ).toBuffer();

        // 줄였는데 오히려 커지면(이미 매우 높게 압축된 원본) 원본을 유지한다.
        if (out.length >= file.buffer.length) {
            return file;
        }
        return withBuffer(file, out, asJpeg ? 'image/jpeg' : 'image/webp');
    } catch (error: any) {
        throw new BadRequestError(`이미지를 처리할 수 없습니다: ${error.message}`);
    }
}

/**
 * 목록용 썸네일(WebP)을 만든다. 원본보다 크게 늘리지 않는다.
 */
export async function createThumbnail(file: UploadedFileInfo, width: number): Promise<Buffer> {
    try {
        return await sharp(file.buffer)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: THUMBNAIL_QUALITY })
            .toBuffer();
    } catch (error: any) {
        throw new BadRequestError(`썸네일을 만들 수 없습니다: ${error.message}`);
    }
}

function withBuffer(file: UploadedFileInfo, buffer: Buffer, mimeType: string): UploadedFileInfo {
    const ext = mimeType === 'image/jpeg' ? '.jpg' : '.webp';
    const parsed = path.parse(file.fileName);
    // 포맷이 바뀌지 않은 JPEG 는 원래 확장자(.jpeg 등)를 유지한다.
    const keepExt = mimeType === file.mimeType && parsed.ext !== '';
    return {
        ...file,
        buffer,
        mimeType,
        fileName: keepExt ? file.fileName : `${parsed.name}${ext}`,
        size: buffer.length,
    };
}
