import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bookingController from '../controllers/bookingController';
import { GetSlotsPayload } from '../interfaces/booking';

async function bookingRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  fastify.post<{ Body: GetSlotsPayload }>('/slots', bookingController.getSlots);
}

export default bookingRoutes;
