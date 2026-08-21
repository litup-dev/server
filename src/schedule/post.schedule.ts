import { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { createStorageAdapter } from '@/adapters/storage/index.js';
import { FileManager } from '@/utils/fileManager.js';

const prisma = new PrismaClient();

/**
 * 에디터 선업로드 후 글 저장까지 이어지지 않은 고아 이미지(post_id NULL) 정리.
 * 작성 중인 글의 이미지를 지우지 않도록 24시간 지난 것만 삭제한다.
 */
export default async function schedulePostTasks(fastify: FastifyInstance) {
    const fileManager = new FileManager(createStorageAdapter());
    const batchSize = Number(process.env.POST_ORPHAN_IMAGE_SCHEDULE_BATCH || 100);

    async function cleanupOrphanImages() {
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

        while (true) {
            const orphans = await prisma.post_img_tb.findMany({
                where: {
                    post_id: null,
                    created_at: { lt: threshold },
                },
                select: { id: true, file_path: true },
                orderBy: { id: 'asc' },
                take: batchSize,
            });

            if (orphans.length === 0) break;

            fastify.log.info(
                `고아 게시글 이미지 정리 id 범위: ${orphans[0]!.id} ~ ${orphans[orphans.length - 1]!.id}`
            );

            for (const orphan of orphans) {
                try {
                    await fileManager.deleteFile(orphan.file_path);
                } catch (error) {
                    fastify.log.error(
                        { error, filePath: orphan.file_path },
                        '고아 이미지 파일 삭제 실패'
                    );
                }
            }

            await prisma.post_img_tb.deleteMany({
                where: { id: { in: orphans.map((o) => o.id) } },
            });
        }
    }

    /**
     * 오래 방치된 임시저장(draft) 정리. 마지막 수정(없으면 생성) 후 30일 지난 draft를
     * 이미지 파일까지 함께 삭제한다. 댓글/좋아요/이미지 row는 FK cascade로 함께 삭제된다.
     */
    async function cleanupStaleDrafts() {
        const retentionDays = Number(process.env.POST_DRAFT_RETENTION_DAYS || 30);
        const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

        while (true) {
            const drafts = await prisma.post_tb.findMany({
                where: {
                    is_draft: true,
                    OR: [
                        { updated_at: { lt: threshold } },
                        { updated_at: null, created_at: { lt: threshold } },
                    ],
                },
                select: { id: true },
                orderBy: { id: 'asc' },
                take: batchSize,
            });

            if (drafts.length === 0) break;

            fastify.log.info(
                `장기 미사용 임시저장 정리 id 범위: ${drafts[0]!.id} ~ ${drafts[drafts.length - 1]!.id}`
            );

            for (const draft of drafts) {
                const images = await prisma.post_img_tb.findMany({
                    where: { post_id: draft.id },
                    select: { file_path: true },
                });
                for (const image of images) {
                    try {
                        await fileManager.deleteFile(image.file_path);
                    } catch (error) {
                        fastify.log.error(
                            { error, filePath: image.file_path },
                            '임시저장 이미지 파일 삭제 실패'
                        );
                    }
                }
                await prisma.post_tb.delete({ where: { id: draft.id } });
            }
        }
    }

    const orphanImageTask = cron.schedule(
        '0 30 3 * * *', // 매일 새벽 3시 30분
        async () => {
            try {
                await cleanupOrphanImages();
            } catch (err) {
                fastify.log.error(err, '고아 게시글 이미지 정리 실패');
            }
        },
        {
            timezone: 'Asia/Seoul',
        }
    );

    const staleDraftTask = cron.schedule(
        '0 40 3 * * *', // 매일 새벽 3시 40분
        async () => {
            try {
                await cleanupStaleDrafts();
            } catch (err) {
                fastify.log.error(err, '장기 미사용 임시저장 정리 실패');
            }
        },
        {
            timezone: 'Asia/Seoul',
        }
    );

    fastify.addHook('onReady', async () => {
        try {
            orphanImageTask.start();
            staleDraftTask.start();
            fastify.log.info('Post Schedule Task started');
        } catch (e) {
            fastify.log.error(e, '게시글 정리 스케쥴 시작 실패');
        }
    });

    fastify.addHook('onClose', async (_instance) => {
        try {
            orphanImageTask.stop();
            staleDraftTask.stop();
        } catch (error) {
            fastify.log.error(error, '게시글 정리 스케쥴 중지 실패');
        }
    });
}
