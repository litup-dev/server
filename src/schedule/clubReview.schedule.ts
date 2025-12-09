import { FastifyInstance } from 'fastify';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function scheduleClubReviewTasks(fastify: FastifyInstance) {
    const batchSize = Number(process.env.CLUB_REVIEW_KEYWORD_SCHEDULE_BATCH || 1000);

    async function reconcileKeywords(batch = batchSize) {
        const failedBatches: { lastId: number; error: unknown }[] = [];

        try {
            let lastId = 0;
            while (true) {
                const keywords = await prisma.club_review_keyword_tb.findMany({
                    where: { id: { gt: lastId } },
                    select: {
                        id: true,
                        keyword_id: true,
                        review_id: true,
                        club_review_tb: {
                            select: {
                                club_id: true,
                            },
                        },
                    },
                    orderBy: { id: 'asc' },
                    take: batch,
                });

                if (keywords.length === 0) break;
                fastify.log.info(
                    `클럽 리뷰 키워드 집계 id 범위: ${keywords[0]!.id} ~ ${keywords[keywords.length - 1]!.id}`
                );

                const existingSummaries = await prisma.club_keyword_summary.findMany({
                    where: {
                        review_id: { in: keywords.map((k) => k.review_id) },
                    },
                    select: {
                        review_id: true,
                        keyword_id: true,
                    },
                });

                const existingSet = new Set(
                    existingSummaries.map((s) => `${s.review_id}-${s.keyword_id}`)
                );

                const inserts = keywords
                    .filter((k) => !existingSet.has(`${k.review_id}-${k.keyword_id}`))
                    .map((k) => ({
                        club_id: k.club_review_tb.club_id,
                        keyword_id: k.keyword_id,
                        review_id: k.review_id,
                    }));

                if (inserts.length > 0) {
                    await prisma.club_keyword_summary.createMany({
                        data: inserts,
                        skipDuplicates: true,
                    });
                }

                const lastKeyword = keywords[keywords.length - 1];
                if (!lastKeyword) break;

                lastId = lastKeyword.id;
            }
        } catch (error) {
            fastify.log.error('클럽 리뷰 키워드 집계 중 오류 발생');
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
                await reconcileKeywords(1000);
            } catch (err) {
                fastify.log.error(err, '클럽 리뷰 키워드 집계 실패');
            }
        },
        {
            timezone: 'Asia/Seoul',
        }
    );

    fastify.addHook('onReady', async () => {
        try {
            task.start();
            fastify.log.info('Club Review Schedule Task started');
        } catch (e) {
            fastify.log.error(e, '클럽 리뷰 키워드 집계 스케쥴 시작 실패');
        }
    });

    fastify.addHook('onClose', async (_instance) => {
        try {
            task.stop();
        } catch (error) {
            fastify.log.error(error, '클럽 리뷰 키워드 집계 스케쥴 중지 실패');
        }
    });
}
