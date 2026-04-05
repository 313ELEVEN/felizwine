#!/bin/sh

# Запускаем скрипт инициализации базы данных
echo "Initializing database..."
python database.py

# Затем запускаем основное приложение
echo "Starting Gunicorn..."
python -m gunicorn app:app --bind 0.0.0.0:${PORT:-10000}
