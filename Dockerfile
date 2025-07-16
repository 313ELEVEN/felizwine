# 1. Базовый образ с официальным Python
FROM python:3.11-slim

# --- НОВЫЙ ШАГ: Устанавливаем системные зависимости для сборки ---
RUN apt-get update && apt-get install -y gcc build-essential

# 2. Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# 3. Копируем файл с зависимостями и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Копируем весь остальной код проекта
COPY . .

# 5. Команда для запуска приложения
CMD ["python", "-m", "gunicorn", "app:app", "--bind", "0.0.0.0:10000"]