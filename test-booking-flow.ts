/**
 * Тестовый скрипт для проверки флоу получения слотов и создания бронирования
 * 
 * Использование:
 * npx ts-node test-booking-flow.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

interface TestSlot {
  start_stamp: number;
  end_stamp: number;
  duration: number;
  start_datetime: string;
  end_datetime: string;
  is_free: boolean;
  tables_count?: number;
  tables_ids?: number[];
  table_bundles?: any[];
  isEvent: boolean;
}

async function testBookingFlow() {
  console.log('=== Тестирование флоу бронирования ===\n');

  const restaurant_id = 2;
  const guests_count = 3;
  const date = '2025-12-30'; // Используем дату из примера

  // Шаг 1: Получение слотов
  console.log('1. Получение доступных слотов...');
  const slotsPayload = {
    restaurant_id,
    reserve_from: date,
    reserve_to: date,
    guests_count,
    with_rooms: false,
  };

  try {
    const slotsResponse = await fetch(`${API_BASE_URL}/api/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slotsPayload),
    });

    if (!slotsResponse.ok) {
      console.error(`Ошибка получения слотов: ${slotsResponse.status} ${slotsResponse.statusText}`);
      const errorText = await slotsResponse.text();
      console.error('Ответ:', errorText);
      return;
    }

    const slots: TestSlot[] = await slotsResponse.json();
    console.log(`✓ Получено слотов: ${slots.length}\n`);

    if (slots.length === 0) {
      console.log('Нет доступных слотов для указанных параметров.');
      return;
    }

    // Выводим информацию о слотах
    console.log('Доступные слоты:');
    slots.forEach((slot, index) => {
      console.log(`\nСлот ${index + 1}:`);
      console.log(`  Время: ${slot.start_datetime} - ${slot.end_datetime}`);
      console.log(`  Свободен: ${slot.is_free}`);
      console.log(`  Количество столов: ${slot.tables_count || 'N/A'}`);
      console.log(`  ID столов: ${slot.tables_ids ? slot.tables_ids.join(', ') : 'N/A'}`);
    });

    // Выбираем первый свободный слот для тестирования
    const selectedSlot = slots.find(slot => slot.is_free && slot.tables_ids && slot.tables_ids.length > 0);
    
    if (!selectedSlot) {
      console.log('\nНет свободных слотов с доступными столами.');
      return;
    }

    console.log(`\n✓ Выбран слот для тестирования: ${selectedSlot.start_datetime}`);
    console.log(`  Столы: ${selectedSlot.tables_ids?.join(', ')}`);

    // Шаг 2: Создание бронирования
    console.log('\n2. Создание бронирования...');
    
    // Извлекаем время из start_datetime (формат: "YYYY-MM-DD HH:MM:SS")
    const time = selectedSlot.start_datetime.split(' ')[1] || '20:30:00';

    const bookingPayload = {
      restaurant_id,
      name: 'Test User',
      phone: '+79001234567',
      email: 'test@example.com',
      date,
      time,
      guests_count,
      children_count: 0,
      utm: 'test',
      deposit_sum: 0,
      deposit_status: 'unpaid',
      comment: 'Тестовое бронирование',
      event_tags: [],
    };

    console.log('Отправка запроса на создание бронирования:');
    console.log(JSON.stringify(bookingPayload, null, 2));

    const bookingResponse = await fetch(`${API_BASE_URL}/api/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    });

    const bookingResult = await bookingResponse.json();
    
    console.log(`\nСтатус ответа: ${bookingResponse.status}`);
    console.log('Ответ от API:');
    console.log(JSON.stringify(bookingResult, null, 2));

    if (bookingResponse.ok && bookingResult.reserve_id) {
      console.log(`\n✓ Бронирование успешно создано!`);
      console.log(`  ID бронирования: ${bookingResult.reserve_id}`);
      console.log(`  ID столов: ${bookingResult.table_ids?.join(', ') || 'N/A'}`);
    } else {
      console.log(`\n✗ Ошибка создания бронирования`);
      console.log(`  Сообщение: ${bookingResult.message || 'Неизвестная ошибка'}`);
    }

  } catch (error: any) {
    console.error('Ошибка при тестировании:', error.message);
    console.error(error.stack);
  }
}

// Запуск теста
testBookingFlow().catch(console.error);

