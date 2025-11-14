import config from '../config';
import { SendReviewPayload, SendReviewResponse } from '../interfaces/rocketData';

class RocketDataService {
  private rocketDataApiUrl: string;
  private rocketDataToken: string;

  constructor(rocketDataApiUrl: string, rocketDataToken: string) {
    this.rocketDataApiUrl = rocketDataApiUrl;
    this.rocketDataToken = rocketDataToken;
  }

  public async sendReview(payload: SendReviewPayload): Promise<SendReviewResponse | false> {
    let { comment, rating, author, company_id, brand_id, catalog_id, restaurant_id, origin_url, creation_time, phone, user_fields_email, tags, notes } = payload;

    // Динамическая подстановка company_id, brand_id, catalog_id, если restaurant_id = 12
    if (restaurant_id === 12) {
      company_id = 3895167;
      brand_id = 472760;
      catalog_id = 479;
    }

    const reviewPayload: any = {
      comment: comment,
      rating: rating,
      author: author,
      company_id: company_id,
      brand_id: brand_id,   // Теперь обязательное поле
      catalog_id: catalog_id, // Теперь обязательное поле
    };

    if (origin_url) reviewPayload.origin_url = origin_url;
    if (creation_time) reviewPayload.creation_time = creation_time;
    if (phone) reviewPayload.phone = phone;

    // Если tags существует и не пуст, добавляем его
    if (tags && tags.length > 0) {
      reviewPayload.tags = tags;
    } else {
      reviewPayload.tags = []; // Убедимся, что это всегда массив, если не предоставлен
    }

    // Если notes существует и не пуст, добавляем его
    if (notes && notes.length > 0) {
      reviewPayload.notes = notes;
    } else {
      reviewPayload.notes = []; // Убедимся, что это всегда массив, если не предоставлен
    }

    // Обрабатываем user_fields как строку, если user_fields_email есть, иначе пустая строка
    if (user_fields_email) {
      reviewPayload.user_fields = JSON.stringify({ email: user_fields_email });
    } else {
      reviewPayload.user_fields = ""; // Пустая строка, если email отсутствует
    }

    console.log('Sending reviewPayload to RocketData:', reviewPayload);

    try {
      const response = await fetch(`${this.rocketDataApiUrl}/public/v4/reviews/custom_reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.rocketDataToken}`,
        },
        body: Buffer.from(JSON.stringify(reviewPayload), 'utf8'),
      });

      const json_resp: any = await response.json();

      console.log('RocketData API Raw Response Status:', response.status);
      console.log('RocketData API Raw Response Status Text:', response.statusText);
      console.log('RocketData API Raw Response Headers:', response.headers);
      console.log('RocketData API Raw Response Body:', json_resp);

      if (response.ok) { // Check for any 2xx status code
        if (json_resp.id) {
          return { status: 'success', review_id: json_resp.id.toString() }; // Ensure review_id is string
        } else {
          console.error('RocketDataService.sendReview: Success response but no review_id in body:', json_resp);
          return false;
        }
      } else {
        console.error('Error in RocketDataService.sendReview (non-2xx status):', json_resp);
        return false;
      }
    } catch (error: any) {
      console.error('Error in RocketDataService.sendReview (fetch exception):', error.message);
      throw error;
    }
  }
}

export default new RocketDataService(config.rocketDataApiUrl, config.rocketDataToken);
