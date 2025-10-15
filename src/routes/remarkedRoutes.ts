import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bookingController from '../controllers/bookingController';
import eventController from '../controllers/eventController';
import {
  CreateReservePayload,
  GetSlotsPayload,
  RemoveReservePayload,
  BuyTicketPayload,
  CheckPaymentPayload,
  GetEventsPayload,
  HoldTicketsPayload
} from '../interfaces/booking';

async function remarkedRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  // Booking routes
  fastify.post<{ Body: CreateReservePayload }>('/reserve', bookingController.createReserve);
  fastify.post<{ Body: GetSlotsPayload }>('/slots', bookingController.getSlots);
  fastify.post<{ Body: RemoveReservePayload }>('/reserve/cancel', bookingController.removeReserve);
  fastify.post<{ Body: BuyTicketPayload }>('/ticket/buy', bookingController.buyTicket);
  fastify.post<{ Body: CheckPaymentPayload }>('/payment/check', bookingController.checkPayment);

  // Event routes
  fastify.get<{ Querystring: GetEventsPayload }>('/events', eventController.getEvents);
  fastify.post<{ Body: HoldTicketsPayload }>('/events/holdTickets', eventController.holdTickets);
}

export default remarkedRoutes;

