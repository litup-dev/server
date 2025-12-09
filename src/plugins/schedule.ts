import { FastifyInstance } from 'fastify';
import schedulePerformanceReviewTasks from '../schedule/performanceReview.schedule.js';
import scheduleClubReviewTasks from '@/schedule/clubReview.schedule.js';

export async function registerSchedule(fastify: FastifyInstance) {
    if (process.env.NODE_ENV === 'production') {
        fastify.log.info('Production >>> Schedule Registration');
        fastify.register(schedulePerformanceReviewTasks);
        fastify.register(scheduleClubReviewTasks);
    }
}
