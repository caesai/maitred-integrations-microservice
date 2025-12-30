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
    // Используем with_rooms: true чтобы получить полную информацию о table_bundles_with_count
    const slotsPayload: GetSlotsPayload = {
      restaurant_id: payload.restaurant_id,
      reserve_from: payload.date,
      reserve_to: payload.date,
      guests_count: payload.guests_count,
      with_rooms: true, // Нужно true для получения table_bundles_with_count
    };
    const slotsResult = await this.getSlots(slotsPayload);

    let availableSlots: RemarkedSlot[];

    if (Array.isArray(slotsResult)) {
      availableSlots = slotsResult;
    } else if (slotsResult && slotsResult.slots) {
      availableSlots = slotsResult.slots;
    } else {
      return false;
    }

    if (availableSlots.length === 0) {
      return false;
    }

    // Find the slot that matches the requested time
    // payload.time format: "HH:MM:SS" or "HH:MM"
    // slot.start_datetime format: "YYYY-MM-DD HH:MM:SS"
    const requestedTime = payload.time.trim();
    // Normalize requested time to HH:MM format for comparison
    const requestedTimeNormalized = requestedTime.length === 5 ? requestedTime : requestedTime.substring(0, 5);
    
    let selectedSlot: RemarkedSlot | undefined;
    
    for (const slot of availableSlots) {
      if (!slot.is_free) {
        continue;
      }
      
      // Extract time from start_datetime (format: "YYYY-MM-DD HH:MM:SS")
      const slotTime = slot.start_datetime.split(' ')[1] || '';
      const slotTimeNormalized = slotTime.substring(0, 5); // Get HH:MM format
      
      // Check if the slot time matches the requested time (compare HH:MM)
      if (slotTimeNormalized === requestedTimeNormalized) {
        selectedSlot = slot;
        break;
      }
    }

    // If no exact match found, check if the requested time slot exists but is not free
    if (!selectedSlot) {
      const requestedSlotExists = availableSlots.some(slot => {
        const slotTime = slot.start_datetime.split(' ')[1] || '';
        const slotTimeNormalized = slotTime.substring(0, 5);
        return slotTimeNormalized === requestedTimeNormalized;
      });
      
      if (requestedSlotExists) {
        return false;
      }
      
      // If slot doesn't exist at all, try to find the closest available slot
      for (const slot of availableSlots) {
        if (slot.is_free) {
          selectedSlot = slot;
          break;
        }
      }
    }

    if (!selectedSlot || !selectedSlot.is_free) {
      return false;
    }

    // Choose the best table bundle for the requested guests_count
    let table_ids_to_book: number[] = [];
    
    // First, try to use table_bundles_with_count if available
    if (selectedSlot.table_bundles_with_count) {
      // First, try to find bundle that matches guests_count exactly
      let matchingBundle = Object.values(selectedSlot.table_bundles_with_count).find(
        (bundle: any) => bundle.count === payload.guests_count
      );
      
      // If no exact match, find the smallest bundle that can accommodate guests_count
      if (!matchingBundle) {
        const suitableBundles = Object.values(selectedSlot.table_bundles_with_count)
          .filter((bundle: any) => bundle.count >= payload.guests_count)
          .sort((a: any, b: any) => a.count - b.count); // Sort by count ascending
        
        if (suitableBundles.length > 0) {
          matchingBundle = suitableBundles[0]; // Take the smallest suitable bundle
        }
      }
      
      if (matchingBundle) {
        table_ids_to_book = matchingBundle.table;
      }
    }
    
    // If no matching bundle found, try table_bundles
    if (table_ids_to_book.length === 0 && selectedSlot.table_bundles && selectedSlot.table_bundles.length > 0) {
      // Find the first bundle that has enough tables for guests_count
      for (const bundle of selectedSlot.table_bundles) {
        if (Array.isArray(bundle) && bundle.length > 0) {
          table_ids_to_book = bundle;
          break;
        }
      }
    }
    
    // Fallback to tables_ids if no bundles available
    if (table_ids_to_book.length === 0 && selectedSlot.tables_ids && selectedSlot.tables_ids.length > 0) {
      table_ids_to_book = selectedSlot.tables_ids;
    }

    if (table_ids_to_book.length === 0) {
      return false;
    }

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
        return false;
      }
    } catch (error: any) {
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

      const responseText = await response.text();

      let json_resp: GetSlotsResponse;
      try {
        json_resp = JSON.parse(responseText) as GetSlotsResponse;
      } catch (parseError: any) {
        return [];
      }

      if (json_resp.status === 'error') {
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
        return false;
      } else {
        return {
          request_id: request_id,
          reserve_id: json_resp.reserve_id as number,
        };
      }
    } catch (error: any) {
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
        return false;
      }
      return json_resp.events;
    } catch (error: any) {
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
        return false;
      }

      // Если статус 200, парсим как успешный ответ
      try {
        const json_resp = JSON.parse(responseText) as HoldTicketsResponse;
        return json_resp;
      } catch (jsonError: any) {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }
}

export default new RemarkedService(config.remarkedApiUrl, config.remarkedApiV2BookingUrl);
