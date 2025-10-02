import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import eventController from '../controllers/eventController';
import {
  GetEventsPayload,
  HoldTicketsPayload
} from '../interfaces/booking';

async function eventRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  fastify.get<{ Querystring: GetEventsPayload }>('/events', eventController.getEvents);
  fastify.post<{ Body: HoldTicketsPayload }>('/events/holdTickets', eventController.holdTickets);
}

export default eventRoutes;
