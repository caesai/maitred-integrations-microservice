import config from '../config';
import https from 'https';
import {
  IikoAccessTokenPayload,
  IikoAccessTokenResponse,
  IikoOrganizationsResponse,
  IikoExternalMenusResponse,
  IikoMenuByIdPayload,
  IikoMenuByIdResponse,
  GetIikoMenuPayload,
  IikoMenuResponse,
  IikoOrganization,
  IikoExternalMenu
} from '../interfaces/iiko';

class IikoService {
  private iikoApiUrl: string;
  private iikoApiLogin: string;
  private accessToken: string | null = null;
  private tokenExpiryTime: number = 0; // Timestamp when the token expires

  // Mapping for restaurant_id to iiko organizationId and externalMenuId
  // Based on the actual external menus from iiko API
  private restaurantIikoMap: Record<number, { organizationId: string; externalMenuId: string; }> = {
    1: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '64705' }, // Blackchops
    2: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '62269' }, // Poly
    3: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '64677' }, // Траппист - Санкт-Петербург
    4: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '64801' }, // Self Edge Japanese - Санкт-петербург
    5: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '64678' }, // Pame
    6: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '68647' }, // Smoke BBQ - Рубинштейна
    7: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '64691' }, // Self Edge Japanese - Екатеринбург
    9: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '65653' }, // Smoke BBQ - Трубная (Москва)
    10: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '64719' }, // Self Edge Japanese - Москва
    11: { organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9', externalMenuId: '64690' }, // Smoke BBQ - Лодейнопольская
    // Note: restaurant_id 12 (Тест 12) doesn't have corresponding external menu yet
  };

  constructor(iikoApiUrl: string, iikoApiLogin: string) {
    this.iikoApiUrl = iikoApiUrl;
    this.iikoApiLogin = iikoApiLogin;
  }

  private async getAccessToken(): Promise<string | false> {
    // Check if token exists and is still valid
    if (this.accessToken && Date.now() < this.tokenExpiryTime) {
      return this.accessToken;
    }

    const payload: IikoAccessTokenPayload = {
      apiLogin: this.iikoApiLogin,
    };

    try {
      const response = await fetch(`${this.iikoApiUrl}/api/1/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return false;
      }

      let json_resp: IikoAccessTokenResponse;
      try {
        json_resp = JSON.parse(responseText) as IikoAccessTokenResponse;
      } catch (jsonError: any) {
        return false;
      }

      if (json_resp.token) {
        this.accessToken = json_resp.token;
        // iiko tokens are typically valid for 60 minutes (3600 seconds)
        this.tokenExpiryTime = Date.now() + 3600 * 1000 - (5 * 60 * 1000); // 5 minutes buffer
        return this.accessToken;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }

  public async getOrganizations(): Promise<IikoOrganization[] | false> {
    const token = await this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.iikoApiUrl}/api/1/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ apiLogin: this.iikoApiLogin }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return false;
      }

      let json_resp: IikoOrganizationsResponse;
      try {
        json_resp = JSON.parse(responseText) as IikoOrganizationsResponse;
      } catch (jsonError: any) {
        return false;
      }

      if (json_resp.organizations) {
        return json_resp.organizations;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }

  public async getExternalMenus(): Promise<IikoExternalMenu[] | false> {
    const token = await this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.iikoApiUrl}/api/2/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return false;
      }

      let json_resp: IikoExternalMenusResponse;
      try {
        json_resp = JSON.parse(responseText) as IikoExternalMenusResponse;
      } catch (jsonError: any) {
        return false;
      }

      if (json_resp.externalMenus) {
        return json_resp.externalMenus;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }

  // Using native https module for better compatibility with iiko API
  private getMenuByIdWithHttps(payload: IikoMenuByIdPayload, token: string): Promise<IikoMenuByIdResponse | false> {
    return new Promise((resolve) => {
      const data = JSON.stringify(payload);
      
      const options: https.RequestOptions = {
        hostname: 'api-ru.iiko.services',
        path: '/api/2/menu/by_id',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve(false);
            return;
          }

          try {
            const json_resp = JSON.parse(body) as IikoMenuByIdResponse;
            resolve(json_resp);
          } catch (jsonError: any) {
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        resolve(false);
      });

      req.write(data);
      req.end();
    });
  }

  public async getMenuById(payload: IikoMenuByIdPayload): Promise<IikoMenuByIdResponse | false> {
    const token = await this.getAccessToken();
    if (!token) return false;

    return this.getMenuByIdWithHttps(payload, token);
  }

  private async getMenuForSingleRestaurant(restaurant_id: number): Promise<IikoMenuResponse> {
    // First, try to use hardcoded mapping if available
    const mapping = this.restaurantIikoMap[restaurant_id];

    if (mapping) {
      const menuPayload: IikoMenuByIdPayload = {
        externalMenuId: mapping.externalMenuId,
        organizationIds: [mapping.organizationId],
      };
      const menu = await this.getMenuById(menuPayload);
      
      if (menu === false) {
        return {
          restaurant_id,
          menu: null,
          error: 'Failed to retrieve menu from iiko API',
        };
      }
      
      return {
        restaurant_id,
        menu,
      };
    }

    // If no mapping found, return error
    return {
      restaurant_id,
      menu: null,
      error: `No mapping found for restaurant_id ${restaurant_id}. Please add it to restaurantIikoMap.`,
    };
  }

  public async getMenuForRestaurants(payload: GetIikoMenuPayload): Promise<IikoMenuResponse[]> {
    const { restaurant_ids } = payload;

    // Validate that restaurant_ids is provided and is an array
    if (!restaurant_ids || !Array.isArray(restaurant_ids) || restaurant_ids.length === 0) {
      throw new Error('restaurant_ids must be a non-empty array');
    }

    // Process all restaurant_ids in parallel
    const menuPromises = restaurant_ids.map(restaurant_id => 
      this.getMenuForSingleRestaurant(restaurant_id)
    );

    return Promise.all(menuPromises);
  }
}

export default new IikoService(config.iikoApiUrl, config.iikoToken);
