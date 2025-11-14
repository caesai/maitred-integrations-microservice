import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import iikoController from '../controllers/iikoController';
import { GetIikoMenuPayload } from '../interfaces/iiko';

async function iikoRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  fastify.post<{ Body: GetIikoMenuPayload }>('/menu', iikoController.getMenu);
}

export default iikoRoutes;
