import buildApp from './app';
import config from './config';

const start = async () => {
  const fastify = await buildApp();
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`Сервер запущен на ${config.host}:${config.port} порту`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
