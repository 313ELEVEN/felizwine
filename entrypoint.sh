#!/bin/sh

# Запускаем скрипт инициализации базы данных
echo "Initializing database..."
python database.py

# Бот работает через webhook на ПРЯМОЙ Render-URL (felizwine.onrender.com),
# минуя Cloudflare (он блокирует входящие запросы Telegram). Polling на сервере
# не нужен — webhook ставится через set_webhook.py / Telegram API.

# Запускаем основное приложение
echo "Starting Gunicorn..."
python -m gunicorn app:app \
  --bind 0.0.0.0:${PORT:-10000} \
  --worker-class gthread \
  --threads ${GUNICORN_THREADS:-4} \
  --timeout ${GUNICORN_TIMEOUT:-120} \
  --graceful-timeout ${GUNICORN_GRACEFUL_TIMEOUT:-30} \
  --keep-alive ${GUNICORN_KEEPALIVE:-5}
