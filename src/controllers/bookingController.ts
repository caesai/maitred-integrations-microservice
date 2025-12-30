import { FastifyRequest, FastifyReply } from 'fastify';
import remarkedService from '../services/remarkedService';
import {
  CreateReservePayload,
  GetSlotsPayload,
  RemoveReservePayload,
  BuyTicketPayload,
  CheckPaymentPayload,
  GetSlotsResponse,
  RemarkedSlot // Добавляем импорт RemarkedSlot
} from '../interfaces/booking';

class BookingController {
  public async createReserve(request: FastifyRequest<{ Body: Omit<CreateReservePayload, 'table_ids'> }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await remarkedService.createReserve(request.body);
      if (result) {
        reply.send(result);
      } else {
        reply.status(400).send({ message: 'Failed to create reservation' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }

  public async getSlots(request: FastifyRequest<{ Body: GetSlotsPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const slotsResult = await remarkedService.getSlots(request.body);
      // Определяем, был ли запрошен with_rooms, чтобы понять, какой тип ответа ожидать
      if (request.body.with_rooms) {
        reply.send(slotsResult as GetSlotsResponse);
      } else {
        reply.send(slotsResult as RemarkedSlot[]);
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }

  public async removeReserve(request: FastifyRequest<{ Body: RemoveReservePayload }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await remarkedService.removeReserve(request.body);
      if (result) {
        reply.send(result);
      } else {
        reply.status(400).send({ message: 'Failed to cancel reservation' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }

  public async buyTicket(request: FastifyRequest<{ Body: BuyTicketPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await remarkedService.buyTicket(request.body);
      if (result) {
        reply.send(result);
      } else {
        reply.status(400).send({ message: 'Failed to buy ticket' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }

  public async checkPayment(request: FastifyRequest<{ Body: CheckPaymentPayload }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await remarkedService.checkPayment(request.body);
      if (result) {
        reply.send(result);
      } else {
        reply.status(400).send({ message: 'Failed to check payment' });
      }
    } catch (error: any) {
      request.log.error(error);
      reply.status(500).send({ message: error.message });
    }
  }
}

export default new BookingController();
