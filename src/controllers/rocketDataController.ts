import { FastifyRequest, FastifyReply } from 'fastify';
import rocketDataService from '../services/rocketDataService';
import { SendReviewPayload } from '../interfaces/rocketData';

class RocketDataController {
  public async sendReview(request: FastifyRequest<{ Body: SendReviewPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await rocketDataService.sendReview(request.body);
      if (result) {
        reply.send(result);
      } else {
        reply.status(400).send({ message: 'Failed to send review to RocketData' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }
}

export default new RocketDataController();

