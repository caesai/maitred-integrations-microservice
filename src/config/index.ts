import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  host: string;
  remarkedApiUrl: string;
  remarkedApiKey: string;
  remarkedApiV2BookingUrl: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  remarkedApiUrl: process.env.REMARKED_API_URL || 'https://app.remarked.ru/api/v1/ApiReservesWidget',
  remarkedApiKey: process.env.REMARKED_API_KEY || 'your_remarked_api_key',
  remarkedApiV2BookingUrl: process.env.REMARKED_API_V2_BOOKING_URL || 'https://app.remarked.ru/api/v2/eventBooking',
};

export default config;
