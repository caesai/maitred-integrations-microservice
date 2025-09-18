import config from '../config';
import { GetSlotsPayload, RemarkedSlot } from '../interfaces/booking';

class RemarkedService {
  private remarkedApiUrl: string;
  private remarkedApiKey: string;

  constructor(remarkedApiUrl: string, remarkedApiKey: string) {
    this.remarkedApiUrl = remarkedApiUrl;
    this.remarkedApiKey = remarkedApiKey;
  }

  public async getSlots(payload: GetSlotsPayload): Promise<RemarkedSlot[]> {
    const fullPayload = {
      method: 'GetSlots',
      token: this.remarkedApiKey, 
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
      
      const slots: RemarkedSlot[] = json_resp.slots as RemarkedSlot[];
      return slots.filter(slot => slot.is_free);
    } catch (error: any) {
      console.error('Error in RemarkedService.getSlots:', error.message);
      throw error;
    }
  }
}

export default new RemarkedService(config.remarkedApiUrl, config.remarkedApiKey);
