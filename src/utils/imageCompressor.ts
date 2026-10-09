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
