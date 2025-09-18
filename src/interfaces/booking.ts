export interface GetSlotsPayload {
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
}
