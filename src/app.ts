import Fastify, { FastifyInstance } from 'fastify';
import config from './config';
import remarkedRoutes from './routes/remarkedRoutes';
import rocketDataRoutes from './routes/rocketDataRoutes';

async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(remarkedRoutes, { prefix: '/api' });
  fastify.register(rocketDataRoutes, { prefix: '/api/rocketdata' });

  return fastify;
}

export default buildApp;
