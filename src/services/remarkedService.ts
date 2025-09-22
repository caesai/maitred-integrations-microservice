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
  CheckPaymentResponse
} from '../interfaces/booking';

class RemarkedService {
  private remarkedApiUrl: string;
  private remarkedApiV2BookingUrl: string;

  constructor(remarkedApiUrl: string, remarkedApiV2BookingUrl: string) {
    this.remarkedApiUrl = remarkedApiUrl;
    this.remarkedApiV2BookingUrl = remarkedApiV2BookingUrl;
  }

  private getToken(restaurantId?: number): string {
    const id = restaurantId || config.defaultRestaurantId;
    const token = config.remarkedTokens[id];
    if (!token) {
      throw new Error(`Remarked API token not found for restaurantId: ${id}`);
    }
    return token;
  }

  public async createReserve(payload: CreateReservePayload): Promise<CreateReserveResponse | false> {
    const request_id = uuidv4();
    const token = this.getToken(payload.restaurantId);
    const fullPayload = {
      method: 'CreateReserve',
      token: token, 
      reserve: {
        ...payload,
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

  public async getSlots(payload: GetSlotsPayload): Promise<RemarkedSlot[]> {
    const token = this.getToken(payload.restaurantId);
    const fullPayload = {
      method: 'GetSlots',
      token: token, 
      reserve_date_period: {
        from: payload.reserve_from,
        to: payload.reserve_to,
      },
      guests_count: String(payload.guests_count),
    };

    console.log('Sending payload to Remarked API:', fullPayload);
    try {
      const response = await fetch(this.remarkedApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullPayload),
      });

      const json_resp: any = await response.json();
      console.log('Received response from Remarked API:', json_resp);

      if (json_resp.status === 'error') {
        console.error('Error in RemarkedService.getSlots:', json_resp);
        return [];
      }
      
      const slots: RemarkedSlot[] = (json_resp.slots as RemarkedSlot[]).map(slot => ({ ...slot, isEvent: false }));
      return slots.filter(slot => slot.is_free);
    } catch (error: any) {
      console.error('Error in RemarkedService.getSlots:', error.message);
      throw error;
    }
  }

  public async removeReserve(payload: RemoveReservePayload): Promise<RemoveReserveResponse | false> {
    const request_id = uuidv4();
    const token = this.getToken(payload.restaurantId);
    const fullPayload = {
      method: 'ChangeReserveStatus',
      token: token,
      reserve_id: payload.reserve_id,
      status: payload.status || "canceled",
      cancel_reason: payload.cancel_reason || "", // Ensure cancel_reason is always a string
      request_id: request_id
    };

    console.log('Sending removeReserve payload to Remarked API:', fullPayload);
    try {
      const response = await fetch(this.remarkedApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullPayload),
      });

      const json_resp: any = await response.json();
      console.log('Received removeReserve response from Remarked API:', json_resp);
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
    const token = this.getToken(payload.restaurantId);
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
      console.log(json_resp);
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
    const token = this.getToken(payload.restaurantId);
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
      console.log(json_resp);
      if (response.status !== 200) {
        return null;
      }
      return json_resp;
    } catch (error: any) {
      console.error('Error in RemarkedService.checkPayment:', error.message);
      throw error;
    }
  }
}

export default new RemarkedService(config.remarkedApiUrl, config.remarkedApiV2BookingUrl);
