import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const IIKO_API_URL = process.env.IIKO_API_URL || 'https://api-ru.iiko.services';
const IIKO_TOKEN = process.env.IIKO_TOKEN || '';

// Маппинг ресторанов
const restaurantMap: Record<number, { name: string; externalMenuId: string; organizationId: string }> = {
  1: { name: 'Blackchops', externalMenuId: '64705', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  2: { name: 'Poly', externalMenuId: '62269', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  3: { name: 'Trappist', externalMenuId: '64677', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  4: { name: 'Self Edge Japanese СПб', externalMenuId: '64801', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  5: { name: 'Pame', externalMenuId: '64678', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  6: { name: 'Smoke BBQ Рубинштейна', externalMenuId: '68647', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  7: { name: 'Self Edge Japanese Екб', externalMenuId: '64691', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  9: { name: 'Smoke BBQ Москва', externalMenuId: '65653', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  10: { name: 'Self Edge Japanese Москва', externalMenuId: '64719', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
  11: { name: 'Smoke BBQ Лодейнопольская', externalMenuId: '64690', organizationId: '21f5acd3-1db7-457d-b3cd-f0022a8001a9' },
};

// Получение токена
async function getAccessToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const data = JSON.stringify({ apiLogin: IIKO_TOKEN });
    
    const options: https.RequestOptions = {
      hostname: 'api-ru.iiko.services',
      path: '/api/1/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('Ошибка получения токена:', res.statusCode, body);
          resolve(null);
          return;
        }
        try {
          const json = JSON.parse(body);
          resolve(json.token);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Ошибка запроса токена:', err.message);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

// Получение списка организаций
async function getOrganizations(token: string): Promise<any[]> {
  return new Promise((resolve) => {
    const data = JSON.stringify({ apiLogin: IIKO_TOKEN });
    
    const options: https.RequestOptions = {
      hostname: 'api-ru.iiko.services',
      path: '/api/1/organizations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('Ошибка получения организаций:', res.statusCode, body);
          resolve([]);
          return;
        }
        try {
          const json = JSON.parse(body);
          resolve(json.organizations || []);
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Ошибка запроса организаций:', err.message);
      resolve([]);
    });

    req.write(data);
    req.end();
  });
}

// Получение списка внешних меню
async function getExternalMenus(token: string): Promise<any[]> {
  return new Promise((resolve) => {
    const data = JSON.stringify({});
    
    const options: https.RequestOptions = {
      hostname: 'api-ru.iiko.services',
      path: '/api/2/menu',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error('Ошибка получения меню:', res.statusCode, body);
          resolve([]);
          return;
        }
        try {
          const json = JSON.parse(body);
          resolve(json.externalMenus || []);
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Ошибка запроса меню:', err.message);
      resolve([]);
    });

    req.write(data);
    req.end();
  });
}

// Проверка доступности меню
async function checkMenu(token: string, externalMenuId: string, organizationId: string): Promise<{ success: boolean; error?: string; menuName?: string }> {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      externalMenuId,
      organizationIds: [organizationId],
    });
    
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
          try {
            const errorJson = JSON.parse(body);
            resolve({ success: false, error: errorJson.description || `HTTP ${res.statusCode}` });
          } catch {
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${body.substring(0, 200)}` });
          }
          return;
        }
        try {
          const json = JSON.parse(body);
          resolve({ success: true, menuName: json.name });
        } catch {
          resolve({ success: false, error: 'Не удалось распарсить ответ' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍 Проверка доступности меню для ресторанов...\n');

  // Получаем токен
  console.log('1. Получение токена доступа...');
  const token = await getAccessToken();
  if (!token) {
    console.error('❌ Не удалось получить токен доступа');
    return;
  }
  console.log('✅ Токен получен\n');

  // Получаем организации
  console.log('2. Получение списка организаций...');
  const organizations = await getOrganizations(token);
  console.log(`✅ Найдено организаций: ${organizations.length}`);
  organizations.forEach((org: any) => {
    console.log(`   - ${org.name} (${org.id})`);
  });
  console.log();

  // Получаем внешние меню
  console.log('3. Получение списка внешних меню...');
  const externalMenus = await getExternalMenus(token);
  console.log(`✅ Найдено внешних меню: ${externalMenus.length}`);
  externalMenus.forEach((menu: any) => {
    console.log(`   - ${menu.name} (ID: ${menu.id})`);
  });
  console.log();

  // Проверяем меню для каждого ресторана
  console.log('4. Проверка доступности меню для ресторанов:\n');
  
  const restaurantIdsToCheck = [6, 9]; // Проверяем проблемные рестораны
  
  for (const restaurantId of restaurantIdsToCheck) {
    const restaurant = restaurantMap[restaurantId];
    if (!restaurant) {
      console.log(`❌ Ресторан ${restaurantId}: не найден в маппинге`);
      continue;
    }

    console.log(`Ресторан ${restaurantId} (${restaurant.name}):`);
    console.log(`   externalMenuId: ${restaurant.externalMenuId}`);
    console.log(`   organizationId: ${restaurant.organizationId}`);
    
    // Проверяем, есть ли это меню в списке доступных
    const menuInList = externalMenus.find((m: any) => m.id === restaurant.externalMenuId);
    if (!menuInList) {
      console.log(`   ⚠️  Меню ${restaurant.externalMenuId} НЕ найдено в списке доступных меню!`);
    } else {
      console.log(`   ✅ Меню найдено в списке: "${menuInList.name}"`);
    }

    // Проверяем доступность меню для организации
    const result = await checkMenu(token, restaurant.externalMenuId, restaurant.organizationId);
    if (result.success) {
      console.log(`   ✅ Меню доступно: "${result.menuName}"`);
    } else {
      console.log(`   ❌ Меню недоступно: ${result.error}`);
    }
    console.log();
  }

  // Проверяем все рестораны для полной картины
  console.log('\n5. Проверка всех ресторанов:\n');
  for (const [id, restaurant] of Object.entries(restaurantMap)) {
    const restaurantId = parseInt(id);
    const result = await checkMenu(token, restaurant.externalMenuId, restaurant.organizationId);
    const status = result.success ? '✅' : '❌';
    const info = result.success ? `"${result.menuName}"` : result.error;
    console.log(`${status} Ресторан ${restaurantId} (${restaurant.name}): ${info}`);
  }
}

main().catch(console.error);

