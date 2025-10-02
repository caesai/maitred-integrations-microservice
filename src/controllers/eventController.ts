import { FastifyRequest, FastifyReply } from 'fastify';
import remarkedService from '../services/remarkedService';
import {
  GetEventsPayload,
  HoldTicketsPayload
} from '../interfaces/booking';

class EventController {
  public async getEvents(request: FastifyRequest<{ Querystring: GetEventsPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const { from, to } = request.query;
      const restaurant_id = request.headers['restaurant-id'] ? parseInt(request.headers['restaurant-id'] as string, 10) : undefined;
      const events = await remarkedService.getEvents({ from, to }, restaurant_id);
      if (events) {
        reply.send(events);
      } else {
        reply.status(400).send({ message: 'Failed to retrieve events' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }

  public async holdTickets(request: FastifyRequest<{ Body: HoldTicketsPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await remarkedService.holdTickets(request.body);
      if (result) {
        reply.send(result);
      } else {
        reply.status(400).send({ message: 'Failed to hold tickets' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }
}

export default new EventController();
