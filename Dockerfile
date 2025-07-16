# 1. Используем официальный образ Python
FROM python:3.11-slim

# 2. Устанавливаем рабочую папку внутри контейнера
WORKDIR /app

# 3. Копируем файл с зависимостями и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Копируем весь остальной код проекта
COPY . .

# 5. Команда для запуска приложения (Render требует порт 10000 для Docker)
CMD ["python", "-m", "gunicorn", "app:app", "--bind", "0.0.0.0:10000"]