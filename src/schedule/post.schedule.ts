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

    const task = cron.schedule(
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

    fastify.addHook('onReady', async () => {
        try {
            task.start();
            fastify.log.info('Post Schedule Task started');
        } catch (e) {
            fastify.log.error(e, '고아 게시글 이미지 정리 스케쥴 시작 실패');
        }
    });

    fastify.addHook('onClose', async (_instance) => {
        try {
            task.stop();
        } catch (error) {
            fastify.log.error(error, '고아 게시글 이미지 정리 스케쥴 중지 실패');
        }
    });
}
