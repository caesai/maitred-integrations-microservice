import Fastify, { FastifyInstance } from 'fastify';
import config from './config';
import bookingRoutes from './routes/bookingRoutes';

async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(bookingRoutes, { prefix: '/api' });

  return fastify;
}

export default buildApp;
