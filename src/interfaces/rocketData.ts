
export interface SendReviewPayload {
  comment: string; // Текст отзыва клиента.
  rating: number; // Оценка отзыва: от 1 до 5.
  author: string; // Имя автора отзыва (например, пользователя Telegram).
  company_id: number; // Идентификатор компании в системе RocketData, к которой относится отзыв.
  brand_id: number; // Обязательный идентификатор бренда в системе RocketData.
  catalog_id: number; // Обязательный идентификатор каталога в системе RocketData.
  restaurant_id?: number; // Опциональный идентификатор ресторана для динамической подстановки.
  origin_url?: string; // Опциональная ссылка на источник отзыва (например, URL сообщения в Telegram).
  creation_time?: string; // Опциональная дата и время создания отзыва (в формате ISO 8601, например '2025-10-14T10:30:00Z').
  phone?: string; // Опциональный номер телефона клиента.
  user_fields_email?: string; // Опциональный адрес электронной почты клиента для поля user_fields.
  tags?: Array<{ id: number; title?: string; is_aspect?: boolean; }>; // Опциональный список тегов в виде объектов.
  notes?: Array<{ text: string; id?: number; created_at?: string; updated_at?: string; user?: any }>; // Опциональный список заметок в виде объектов.
}

export interface SendReviewResponse {
  status: string;
  message?: string;
  review_id?: string; // Предполагаемый ID отзыва, который вернет RocketData
}

