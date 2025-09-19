import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bookingController from '../controllers/bookingController';
import {
  CreateReservePayload,
  GetSlotsPayload,
  RemoveReservePayload,
  BuyTicketPayload,
  CheckPaymentPayload
} from '../interfaces/booking';

async function bookingRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  fastify.post<{ Body: CreateReservePayload }>('/reserve', bookingController.createReserve);
  fastify.post<{ Body: GetSlotsPayload }>('/slots', bookingController.getSlots);
  fastify.post<{ Body: RemoveReservePayload }>('/reserve/cancel', bookingController.removeReserve);
  fastify.post<{ Body: BuyTicketPayload }>('/ticket/buy', bookingController.buyTicket);
  fastify.post<{ Body: CheckPaymentPayload }>('/payment/check', bookingController.checkPayment);
}

export default bookingRoutes;
