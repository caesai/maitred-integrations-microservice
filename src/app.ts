import Fastify, { FastifyInstance } from 'fastify';
import config from './config';
import bookingRoutes from './routes/bookingRoutes';
import eventRoutes from './routes/eventRoutes';

async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(bookingRoutes, { prefix: '/api' });
  fastify.register(eventRoutes, { prefix: '/api' });

  return fastify;
}

export default buildApp;
