import { FastifyRequest, FastifyReply } from 'fastify';
import remarkedService from '../services/remarkedService';
import { GetSlotsPayload } from '../interfaces/booking';

class BookingController {
  public async getSlots(request: FastifyRequest<{ Body: GetSlotsPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const slots = await remarkedService.getSlots(request.body);
      reply.send(slots);
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }
}

export default new BookingController();
