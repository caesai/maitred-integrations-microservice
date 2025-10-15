import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rocketDataController from '../controllers/rocketDataController';
import { SendReviewPayload } from '../interfaces/rocketData';

async function rocketDataRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  fastify.post<{ Body: SendReviewPayload }>('/reviews', rocketDataController.sendReview);
}

export default rocketDataRoutes;

