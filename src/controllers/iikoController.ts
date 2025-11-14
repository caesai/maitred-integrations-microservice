import { FastifyRequest, FastifyReply } from 'fastify';
import iikoService from '../services/iikoService';
import { GetIikoMenuPayload } from '../interfaces/iiko';

class IikoController {
  public async getMenu(request: FastifyRequest<{ Body: GetIikoMenuPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await iikoService.getMenuForRestaurant(request.body);
      if (result) {
        reply.send(result);
      } else {
        reply.status(400).send({ message: 'Failed to retrieve iiko menu' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }
}

export default new IikoController();
