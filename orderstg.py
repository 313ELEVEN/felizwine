import sqlite3
import requests
from flask import Flask, request, jsonify, render_template

# --- НАСТРОЙКА ---
# Замените на ваши данные, полученные от Telegram
BOT_TOKEN = '7075151658:AAH9MK6jyguU3BA5J8yK5ZDy5rMYba_9Hgg'
CHAT_ID = '2116037251'
# -----------------

app = Flask(__name__, static_url_path='/static')
DATABASE = 'feliz_wine_bar.db'

# --- ФУНКЦИЯ ДЛЯ РАБОТЫ С БАЗОЙ ДАННЫХ ---
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ (создание таблиц) ---
def init_db():
    with app.app_context():
        conn = get_db_connection()
        cursor = conn.cursor()
        # Таблица для заказов
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                customer_address TEXT NOT NULL,
                total_price REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'Новый',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        # Таблица для позиций в заказе
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders (id)
            )
        ''')
        # ... можно добавить таблицы для меню, категорий и т.д.
        conn.commit()
        conn.close()
        print("База данных успешно инициализирована.")

# --- ФУНКЦИЯ ОТПРАВКИ УВЕДОМЛЕНИЯ В TELEGRAM ---
def send_telegram_notification(order_data):
    # Проверяем, что токен и ID заданы
    if BOT_TOKEN == 'ВАШ_ТОКЕН_ОТ_BOTFATHER' or CHAT_ID == 'ВАШ_ЛИЧНЫЙ_CHAT_ID':
        print("!!! ВНИМАНИЕ: Токен или Chat ID не настроены. Уведомление не отправлено.")
        return

    # Формируем красивое сообщение
    message = (
        f"🎉 *Comanda pentru livrare! #{order_data.get('order_id')}* 🎉\n\n"
        f"👤 *Nume clientului:* {order_data.get('name')}\n"
        f"📞 *Numar mobil* {order_data.get('phone')}\n"
        f"📍 *Adresa livrarii:* {order_data.get('address')}\n\n"
        f"🛒 *Comanda este din:*\n"
    )
    total_price = 0
    for item in order_data.get('cart', []):
        item_total = item.get('price', 0) * item.get('quantity', 0)
        total_price += item_total
        message += f"- {item.get('name')} x {item.get('quantity')} = {item_total} MDL\n"
    
    message += f"\n💰 *Итого:* *{total_price} MDL*"
    
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    params = {"chat_id": CHAT_ID, "text": message, "parse_mode": "Markdown"}

    try:
        response = requests.post(url, data=params)
        if response.status_code == 200:
            print(f"Уведомление для заказа #{order_data.get('order_id')} успешно отправлено в Telegram.")
        else:
            print(f"Ошибка отправки в Telegram: {response.text}")
    except Exception as e:
        print(f"Исключение при отправке в Telegram: {e}")

# --- API ЭНДПОИНТЫ ---

# ГЛАВНЫЙ ЭНДПОИНТ: ПРИЕМ НОВОГО ЗАКАЗА
@app.route('/api/place_order', methods=['POST'])
def place_order():
    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'phone', 'address', 'cart']):
        return jsonify({'success': False, 'message': 'Неполные данные заказа'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Рассчитываем итоговую сумму на сервере для безопасности
        total_price = sum(item['price'] * item['quantity'] for item in data['cart'])

        # 1. Сохраняем основную информацию о заказе
        cursor.execute(
            'INSERT INTO orders (customer_name, customer_phone, customer_address, total_price) VALUES (?, ?, ?, ?)',
            (data['name'], data['phone'], data['address'], total_price)
        )
        order_id = cursor.lastrowid # Получаем ID только что созданного заказа

        # 2. Сохраняем позиции заказа
        for item in data['cart']:
            cursor.execute(
                'INSERT INTO order_items (order_id, name, quantity, price) VALUES (?, ?, ?, ?)',
                (order_id, item['name'], item['quantity'], item['price'])
            )
        
        conn.commit()
        
        # 3. Отправляем уведомление в Telegram
        order_data_for_telegram = {**data, "order_id": order_id}
        send_telegram_notification(order_data_for_telegram)

        return jsonify({'success': True, 'message': 'Заказ успешно размещен'})

    except Exception as e:
        conn.rollback()
        print(f"Ошибка при обработке заказа: {e}")
        return jsonify({'success': False, 'message': 'Внутренняя ошибка сервера'}), 500
    finally:
        conn.close()

# ЭНДПОИНТ ДЛЯ АВТООБНОВЛЕНИЯ ЗАКАЗОВ В АДМИН-ПАНЕЛИ
@app.route('/admin/check_new_orders')
def check_new_orders():
    last_id = request.args.get('last_id', 0, type=int)
    conn = get_db_connection()
    # Ищем все заказы с ID больше, чем последний известный на странице
    new_orders_cursor = conn.execute('SELECT * FROM orders WHERE id > ? ORDER BY id DESC', (last_id,))
    new_orders = new_orders_cursor.fetchall()

    if not new_orders:
        return jsonify({"new_orders": False})

    # Если новые заказы найдены, собираем для них HTML
    html_string = ""
    for order in new_orders:
        order_items_cursor = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (order['id'],))
        order_items = order_items_cursor.fetchall()
        
        # Генерируем HTML для каждой карточки заказа (структура взята из admin_dashboard.html)
        items_html = "".join([f"<li>{item['name']} x {item['quantity']}</li>" for item in order_items])
        
        status_buttons_html = ""
        if order['status'] == 'Новый':
            status_buttons_html = f"""
                <button onclick="updateStatus({order['id']}, 'Одобрен')" class="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-sm transition-colors" title="Одобрить"><i class="fa-solid fa-check"></i></button>
                <button onclick="updateStatus({order['id']}, 'Отменен')" class="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-sm transition-colors" title="Отменить"><i class="fa-solid fa-times"></i></button>
            """
        elif order['status'] == 'Одобрен':
             status_buttons_html = f"""
                <button onclick="updateStatus({order['id']}, 'Доставлен')" class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-sm transition-colors" title="Доставлен"><i class="fa-solid fa-truck"></i></button>
             """

        html_string += f"""
        <div class="bg-gray-700 p-4 rounded-lg flex flex-col" data-order-id="{order['id']}">
            <div class="flex justify-between items-center border-b border-gray-600 pb-2 mb-3">
                <span class="font-bold text-lg">Заказ #{order['id']}</span>
                <span class="px-2 py-1 text-xs font-bold rounded-full status-{order['status']}">{order['status']}</span>
            </div>
            <div class="flex-grow text-sm text-gray-300 space-y-1">
                <p><strong>Имя:</strong> {order['customer_name']}</p>
                <p><strong>Телефон:</strong> {order['customer_phone']}</p>
                <p><strong>Адрес:</strong> {order['customer_address']}</p>
                <div class="mt-2 border-t border-gray-600 pt-2">
                    <p class="font-semibold mb-1">Состав:</p>
                    <ul class="list-disc list-inside text-xs">{items_html}</ul>
                </div>
            </div>
            <p class="mt-3 font-bold text-right text-lg text-yellow-400">Итого: {order['total_price']} MDL</p>
            <div class="mt-3 flex justify-end space-x-2">
                {status_buttons_html}
                <button onclick="deleteOrder({order['id']})" class="bg-gray-600 hover:bg-red-500 text-white py-1 px-2 rounded text-sm transition-colors" title="Удалить заказ">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        """
    conn.close()
    return jsonify({"new_orders": True, "html": html_string})


# --- ЗАПУСК СЕРВЕРА ---
if __name__ == '__main__':
    init_db()  # Создаем таблицы при первом запуске
    # debug=True позволяет видеть ошибки и автоматически перезагружает сервер при изменениях в коде
    app.run(host='0.0.0.0', port=5000, debug=True)