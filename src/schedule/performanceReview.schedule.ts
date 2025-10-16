import { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function schedulePerformanceReviewTasks(fastify: FastifyInstance) {
    const batchSize = Number(process.env.PERFORMANCE_REVIEW_SCHEDULE_BATCH || 1000);

    async function reconcileLike(batch = batchSize) {
        const failedBatches: { lastId: number; error: unknown }[] = [];

        try {
            let lastId = 0;
            while (true) {
                const reviews = await prisma.perform_review_tb.findMany({
                    where: { id: { gt: lastId } },
                    select: {
                        id: true,
                        like_count: true,
                    },
                    orderBy: { id: 'asc' },
                    take: batch,
                });

                if (reviews.length === 0) break;
                fastify.log.info(
                    `한줄평 좋아요 동기화 id 범위: ${reviews[0]!.id} ~ ${reviews[reviews.length - 1]!.id}`
                );

                const ids = reviews.map((r) => r.id);
                const counts = await prisma.perform_review_like_tb.groupBy({
                    by: ['review_id'],
                    where: { review_id: { in: ids } },
                    _count: { _all: true },
                });

                const countMap = new Map<number, number>(
                    counts.map((c) => [c.review_id, c._count._all])
                );

                const updates = [];
                for (const r of reviews) {
                    const reviewTbCount = countMap.get(r.id) ?? 0;
                    if (r.like_count !== reviewTbCount) {
                        updates.push(
                            prisma.perform_review_tb.update({
                                where: { id: r.id },
                                data: { like_count: reviewTbCount },
                            })
                        );
                    }
                }

                if (updates.length > 0) {
                    await prisma.$transaction(updates);
                }
                const lastReview = reviews[reviews.length - 1];
                if (!lastReview) break;

                lastId = lastReview.id;
            }
        } catch (error) {
            fastify.log.error('한줄평 좋아요 동기화 중 오류 발생');
            failedBatches.push({ lastId: -1, error });
        }

        if (failedBatches.length > 0) {
            fastify.log.error(
                {
                    count: failedBatches.length,
                    samples: failedBatches.slice(0, 5),
                },
                '실패한 배치가 있습니다.'
            );
        }
    }

    const task = cron.schedule(
        '0 0 2 * * *', // 매일 새벽 2시
        async () => {
            try {
                await reconcileLike(1000);
            } catch (err) {
                fastify.log.error(err, '한줄평 좋아요 동기화 실패');
            }
        },
        {
            timezone: 'Asia/Seoul',
        }
    );

    fastify.addHook('onReady', async () => {
        try {
            task.start();
            fastify.log.info('Performance Review Schedule Task started');
        } catch (e) {
            fastify.log.error(e, '한줄평 좋아요 동기화 스케쥴 시작 실패');
        }
    });

    fastify.addHook('onClose', async (_instance) => {
        try {
            task.stop();
        } catch (error) {
            fastify.log.error(error, '한줄평 좋아요 동기화 스케쥴 중지 실패');
        }
    });
}
