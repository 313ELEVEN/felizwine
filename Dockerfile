# 1. Базовый образ с официальным Python
FROM python:3.11-slim

# 2. Устанавливаем системные зависимости для сборки
RUN apt-get update && apt-get install -y gcc build-essential

# 3. Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# 4. Копируем файл с зависимостями и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Копируем весь остальной код проекта
COPY . .

# 6. Делаем наш новый скрипт исполняемым
RUN chmod +x /app/entrypoint.sh

# 7. Запускаем наш entrypoint скрипт как команду по умолчанию
CMD ["/app/entrypoint.sh"]