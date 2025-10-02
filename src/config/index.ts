import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  host: string;
  remarkedApiUrl: string;
  remarkedTokens: Record<number, string>; // Dictionary to store tokens by restaurantId
  remarkedApiV2BookingUrl: string;
  defaultRestaurantId: number;
  remarkedEventToken: string; // Добавляем новый токен для мероприятий
}

const remarkedTokens: Record<number, string> = {};
// Assuming a default token is provided for a default restaurant ID 12
const defaultApiKey = process.env.REMARKED_API_KEY || 'your_remarked_api_key';
if (defaultApiKey && process.env.DEFAULT_RESTAURANT_ID) {
  remarkedTokens[parseInt(process.env.DEFAULT_RESTAURANT_ID, 10)] = defaultApiKey;
} else if (defaultApiKey) {
  remarkedTokens[12] = defaultApiKey; // Default to restaurant 12 if no default ID is specified
}

// Add 12 dummy tokens for testing (restaurantId from 1 to 12)
for (let i = 1; i <= 12; i++) {
  remarkedTokens[i] = process.env[`REMARKED_TOKEN_${i}`] || `dummy_token_for_restaurant_${i}`;
}

// Load additional tokens if any, e.g., REMARKED_TOKEN_123=another_token
for (const key in process.env) {
  if (key.startsWith('REMARKED_TOKEN_')) {
    const restId = parseInt(key.replace('REMARKED_TOKEN_', ''), 10);
    if (!isNaN(restId) && !remarkedTokens[restId]) {
      remarkedTokens[restId] = process.env[key] as string;
    }
  }
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  remarkedApiUrl: process.env.REMARKED_API_URL || 'https://app.remarked.ru/api/v1/ApiReservesWidget',
  remarkedTokens: remarkedTokens,
  remarkedApiV2BookingUrl: process.env.REMARKED_API_V2_BOOKING_URL || 'https://app.remarked.ru/api/v2/eventBooking',
  defaultRestaurantId: parseInt(process.env.DEFAULT_RESTAURANT_ID || '12', 10),
  remarkedEventToken: process.env.REMARKED_BOOKING_TOKEN_12 || 'your_remarked_event_token', // Инициализируем токен мероприятий
};

export default config;
