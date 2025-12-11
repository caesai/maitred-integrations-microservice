import config from '../config';
import { v4 as uuidv4 } from 'uuid';
import { 
  CreateReservePayload, 
  CreateReserveResponse, 
  GetSlotsPayload, 
  RemarkedSlot, 
  RemoveReservePayload, 
  RemoveReserveResponse,
  BuyTicketPayload,
  BuyTicketResponse,
  CheckPaymentPayload,
  CheckPaymentResponse,
  GetSlotsResponse,
  GetEventsPayload,      // Новый импорт
  RemarkedEvent,         // Новый импорт
  GetEventsResponse,     // Новый импорт
  HoldTicketsPayload,    // Новый импорт
  HoldTicketsResponse    // Новый импорт
} from '../interfaces/booking';

class RemarkedService {
  private remarkedApiUrl: string;
  private remarkedApiV2BookingUrl: string;
  // private remarkedApiV2EventUrl: string; // Удаляем это, так как будем использовать remarkedApiV2BookingUrl

  constructor(remarkedApiUrl: string, remarkedApiV2BookingUrl: string) {
    this.remarkedApiUrl = remarkedApiUrl;
    this.remarkedApiV2BookingUrl = remarkedApiV2BookingUrl;
    // this.remarkedApiV2EventUrl = `${remarkedApiV2BookingUrl}`; // Удаляем это
  }

  private getToken(restaurant_id?: number, isEvent: boolean = false): string {
    const targetRestaurantId = restaurant_id || config.defaultRestaurantId;

    if (isEvent) {
      if (targetRestaurantId === 12) { // Если это мероприятие и restaurant_id = 12
        if (!config.remarkedEventToken) {
          throw new Error('Remarked event API token not found for restaurant_id 12.');
        }
        return config.remarkedEventToken;
      } else {
        // Заглушка для других restaurant_id при isEvent: true
        console.warn(`Использование заглушки токена для мероприятий для restaurant_id: ${targetRestaurantId}.`);
        return 'dummy_event_token_for_other_restaurants';
      }
    }

    // Существующая логика для не-мероприятий
    const token = config.remarkedTokens[targetRestaurantId];
    if (!token) {
      throw new Error(`Remarked API token not found for restaurant_id: ${targetRestaurantId}`);
    }
    return token;
  }

  public async createReserve(payload: Omit<CreateReservePayload, 'table_ids'>): Promise<CreateReserveResponse | false> {
    const request_id = uuidv4();
    const token = this.getToken(payload.restaurant_id);

    // 1. Get available slots for the given date, time, and guests_count
    const slotsPayload: GetSlotsPayload = {
      restaurant_id: payload.restaurant_id,
      reserve_from: payload.date,
      reserve_to: payload.date,
      guests_count: payload.guests_count,
      with_rooms: false, // Устанавливаем в false, так как для бронирования нужны только слоты
    };
    const slotsResult = await this.getSlots(slotsPayload);

    let availableSlots: RemarkedSlot[];

    if (Array.isArray(slotsResult)) {
      availableSlots = slotsResult;
    } else if (slotsResult && slotsResult.slots) {
      availableSlots = slotsResult.slots;
    } else {
      console.error('Неверный формат ответа от getSlots.');
      return false;
    }

    if (availableSlots.length === 0) {
      console.error('No available slots found for the specified criteria.');
      return false;
    }

    let selectedTableId: number | undefined;
    for (const slot of availableSlots) {
      if (slot.tables_ids && slot.tables_ids.length > 0) {
        selectedTableId = slot.tables_ids[0];
        break; // Found a slot with table_ids, break the loop
      }
    }

    if (selectedTableId === undefined) {
      console.error('No available slot with specific tables_ids found for booking.');
      return false;
    }

    const table_ids_to_book = [selectedTableId]; // Take the first table ID from the selected slot

    const fullPayload = {
      method: 'CreateReserve',
      token: token, 
      reserve: {
        ...payload,
        table_ids: table_ids_to_book, // Add table_ids here
        source: "tma",
        deposit_sum: payload.deposit_sum || 0.0,
        deposit_status: payload.deposit_status || 'unpaid',
        event_tags: payload.event_tags || [],
      },
      request_id,
    };

    try {
      const response = await fetch(this.remarkedApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullPayload),
      });

      const json_resp: any = await response.json();

      if (json_resp.status === 'success') {
        return {
          request_id: request_id,
          reserve_id: json_resp.reserve_id as number,
          table_ids: table_ids_to_book, // Добавляем table_ids
        };
      } else {
        console.error('Error in RemarkedService.createReserve:', json_resp);
        return false;
      }
    } catch (error: any) {
      console.error('Error in RemarkedService.createReserve:', error.message);
      throw error;
    }
  }

  public async getSlots(payload: GetSlotsPayload): Promise<RemarkedSlot[] | GetSlotsResponse> {
    const token = this.getToken(payload.restaurant_id);
    const fullPayload: any = {
      method: 'GetSlots',
      token: token,
      reserve_date_period: {
        from: payload.reserve_from,
        to: payload.reserve_to,
      },
      guests_count: String(payload.guests_count),
    };

    if (payload.with_rooms) {
      fullPayload.with_rooms = true;
    }

    try {
      const response = await fetch(this.remarkedApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullPayload),
      });

      const json_resp = await response.json() as GetSlotsResponse;

      if (json_resp.status === 'error') {
        console.error('Error in RemarkedService.getSlots:', json_resp);
        return []; // Возвращаем пустой массив слотов при ошибке
      }
      
      // Если with_rooms был запрошен, возвращаем полный объект GetSlotsResponse
      if (payload.with_rooms) {
        return json_resp;
      } else {
        // В противном случае, возвращаем только отфильтрованные свободные слоты
        const slots: RemarkedSlot[] = (json_resp.slots as RemarkedSlot[]).map(slot => ({ ...slot, isEvent: false }));
        return slots.filter(slot => slot.is_free);
      }
    } catch (error: any) {
      console.error('Error in RemarkedService.getSlots:', error.message);
      throw error;
    }
  }

  public async removeReserve(payload: RemoveReservePayload): Promise<RemoveReserveResponse | false> {
    const request_id = uuidv4();
    const token = this.getToken(payload.restaurant_id);
    const fullPayload = {
      method: 'ChangeReserveStatus',
      token: token,
      reserve_id: payload.reserve_id,
      status: payload.status || "canceled",
      cancel_reason: payload.cancel_reason || "", // Ensure cancel_reason is always a string
      request_id: request_id
    };

    try {
      const response = await fetch(this.remarkedApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullPayload),
      });

      const json_resp: any = await response.json();
      if (json_resp.status === 'error') {
        console.error('RemoveReserve error:', json_resp);
        return false;
      } else {
        return {
          request_id: request_id,
          reserve_id: json_resp.reserve_id as number,
        };
      }
    } catch (error: any) {
      console.error('Error in RemarkedService.removeReserve:', error.message);
      throw error;
    }
  }

  public async buyTicket(payload: BuyTicketPayload): Promise<BuyTicketResponse | []> {
    const token = this.getToken(payload.restaurant_id);
    try {
      const response = await fetch(`${this.remarkedApiV2BookingUrl}/holdTickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json_resp = await response.json() as BuyTicketResponse;
      if (response.status !== 200) {
        return [];
      }
      return json_resp;
    } catch (error: any) {
      console.error('Error in RemarkedService.buyTicket:', error.message);
      throw error;
    }
  }

  public async checkPayment(payload: CheckPaymentPayload): Promise<CheckPaymentResponse | null> {
    const token = this.getToken(payload.restaurant_id);
    try {
      const response = await fetch(`${this.remarkedApiV2BookingUrl}/checkPaid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json_resp = await response.json() as CheckPaymentResponse;
      if (response.status !== 200) {
        return null;
      }
      return json_resp;
    } catch (error: any) {
      console.error('Error in RemarkedService.checkPayment:', error.message);
      throw error;
    }
  }

  public async getEvents(payload: GetEventsPayload, restaurant_id?: number): Promise<RemarkedEvent[] | false> {
    const token = this.getToken(restaurant_id, true); // Передаем true для isEvent
    try {
      const response = await fetch(`${this.remarkedApiV2BookingUrl}/periodEvents?from=${payload.from}&to=${payload.to}`, { // Используем remarkedApiV2BookingUrl
        method: 'GET', // GET запрос для мероприятий
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Авторизация через токен мероприятий
        },
      });

      const json_resp = await response.json() as GetEventsResponse;
      if (response.status !== 200 || json_resp.events === undefined) {
        console.error('Error in RemarkedService.getEvents:', json_resp);
        return false;
      }
      return json_resp.events;
    } catch (error: any) {
      console.error('Error in RemarkedService.getEvents:', error.message);
      throw error;
    }
  }

  public async holdTickets(payload: HoldTicketsPayload): Promise<HoldTicketsResponse | false> {
    const token = this.getToken(payload.restaurant_id, true); // Передаем true для isEvent
    try {
      // Убираем restaurant_id из payload, так как он используется только для получения токена
      const { restaurant_id, ...apiPayload } = payload;
      const requestBody = JSON.stringify(apiPayload);
      const url = `${this.remarkedApiV2BookingUrl}/holdTickets`;
      
      console.log('holdTickets Request URL:', url);
      console.log('holdTickets Request Payload:', requestBody);
      console.log('holdTickets Token:', token ? 'Token present' : 'Token missing');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: requestBody,
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        // Если статус не 200, пытаемся распарсить как объект с ошибкой
        let errorResponse: any;
        try {
          errorResponse = JSON.parse(responseText);
        } catch {
          errorResponse = { error: responseText || 'Unknown error' };
        }
        console.error('Error in RemarkedService.holdTickets (non-2xx status):', {
          status: response.status,
          statusText: response.statusText,
          body: errorResponse
        });
        return false;
      }

      // Если статус 200, парсим как успешный ответ
      try {
        const json_resp = JSON.parse(responseText) as HoldTicketsResponse;
        return json_resp;
      } catch (jsonError: any) {
        console.error('Error parsing holdTickets response as JSON:', jsonError.message, 'Raw response:', responseText);
        return false;
      }
    } catch (error: any) {
      console.error('Error in RemarkedService.holdTickets:', error.message);
      return false;
    }
  }
}

export default new RemarkedService(config.remarkedApiUrl, config.remarkedApiV2BookingUrl);
