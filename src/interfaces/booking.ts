export interface GetSlotsPayload {
  restaurant_id?: number; // Make optional as it can be defaulted
  reserve_from: string;
  reserve_to: string;
  guests_count: number;
  with_rooms?: boolean; // Добавляем новый параметр
}

export interface RemarkedTable {
  id: number;
  capacity: number;
  min_capacity: number | null;
  max_capacity: number | null;
  room_id: number;
  image_url: string;
  description: string;
  name: string;
}

export interface RemarkedRoom {
  id: number;
  name: string;
  tables: Record<string, RemarkedTable>;
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
  table_bundles_with_count?: Record<string, { count: number; table: number[] }>;
  isEvent: boolean; // New field
}

export interface RemarkedCustomer {
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export interface CreateReservePayload {
  restaurant_id?: number;
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
  event_tags: number[];
}

export interface CreateReserveResponse {
  request_id: string;
  reserve_id: number;
  table_ids?: number[]; // Добавляем необязательное поле table_ids
}

export interface RemoveReservePayload {
  restaurant_id?: number;
  reserve_id: number;
  cancel_reason?: string;
  status?: string;
}

export interface RemoveReserveResponse {
  request_id: string;
  reserve_id: number;
}

export interface BuyTicketPayload {
  restaurant_id?: number;
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
  restaurant_id?: number;
  transaction_guid: string;
}

export interface CheckPaymentResponse {
  [key: string]: any;
}

export interface GetSlotsResponse {
  status: string;
  slots: RemarkedSlot[];
  rooms?: Record<string, RemarkedRoom>;
  interiors?: any; // Может быть null или другим типом
}

export interface GetEventsPayload {
  from: string;
  to: string;
}

export interface RemarkedEvent {
  id: number;
  name: string;
  description: string;
  date_start: string;
  date_end: string;
  ticket_price: number;
  info_url: string;
  free_tickets_quantity: number;
  image_url: string;
  group_id: number;
  additional_info: any | null;
}

export interface GetEventsResponse {
  events: RemarkedEvent[];
}

export interface HoldTicketsPayload {
  restaurant_id?: number;
  event_id: number;
  customer: { // Используем существующий интерфейс RemarkedCustomer, если это возможно, или создаем новый
    name: string;
    surname: string;
    phone: string;
    email: string;
  };
  comment: string;
  tickets_quantity: number;
}

export interface HoldTicketsResponse {
  status: string;
  order_id: string;
  paymentURL: string;
}
