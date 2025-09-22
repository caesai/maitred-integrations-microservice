export interface GetSlotsPayload {
  restaurantId?: number; // Make optional as it can be defaulted
  reserve_from: string;
  reserve_to: string;
  guests_count: number;
}

export interface RemarkedSlot {
  start_stamp: number;
  end_stamp: number;
  duration: number;
  start_datetime: string;
  end_datetime: string;
  is_free: boolean;
  tables_count?: number;
  tables_ids?: number[];
  table_bundles?: any[];
  isEvent: boolean; // New field
}

export interface RemarkedCustomer {
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export interface CreateReservePayload {
  restaurantId?: number;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests_count: number;
  children_count?: number;
  utm: string;
  deposit_sum?: number;
  deposit_status?: string;
  comment: string;
  type?: string;
  source?: string;
  table_ids: number[];
  event_tags: number[];
}

export interface CreateReserveResponse {
  request_id: string;
  reserve_id: number;
}

export interface RemoveReservePayload {
  restaurantId?: number;
  reserve_id: number;
  cancel_reason?: string;
  status?: string;
}

export interface RemoveReserveResponse {
  request_id: string;
  reserve_id: number;
}

export interface BuyTicketPayload {
  restaurantId?: number;
  event_id: number;
  customer: RemarkedCustomer;
  comment: string;
  tickets_quantity: number;
  return_url: string;
}

export interface BuyTicketResponse {
  [key: string]: any;
}

export interface CheckPaymentPayload {
  restaurantId?: number;
  transaction_guid: string;
}

export interface CheckPaymentResponse {
  [key: string]: any;
}
