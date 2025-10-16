import { FastifyInstance } from 'fastify';
import schedulePerformanceReviewTasks from '../schedule/performanceReview.schedule.js';

export async function registerSchedule(fastify: FastifyInstance) {
    fastify.register(schedulePerformanceReviewTasks);
}
