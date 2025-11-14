import Fastify, { FastifyInstance } from 'fastify';
import config from './config';
import remarkedRoutes from './routes/remarkedRoutes';
import rocketDataRoutes from './routes/rocketDataRoutes';
import iikoRoutes from './routes/iikoRoutes'; // New iiko routes

async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(remarkedRoutes, { prefix: '/api' });
  fastify.register(rocketDataRoutes, { prefix: '/api/rocketdata' });
  fastify.register(iikoRoutes, { prefix: '/api/iiko' }); // Register iiko routes

  return fastify;
}

export default buildApp;
