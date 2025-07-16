import webview
from app import app
from waitress import serve
from threading import Thread
import os

# Определяем функцию для запуска сервера Flask
def run_server():
    # Используем waitress для обслуживания приложения на определённом порту
    # Хост '127.0.0.1' гарантирует, что сервер доступен только локально
    serve(app, host='127.0.0.1', port=5000)

if __name__ == '__main__':
    # Запускаем сервер Flask в отдельном потоке
    # Это предотвращает блокировку окна приложения сервером
    server_thread = Thread(target=run_server)
    server_thread.daemon = True  # Позволяет основному потоку завершить дочерний поток сервера
    server_thread.start()

    # Создаём и отображаем окно десктопного приложения
    webview.create_window(
        'Feliz Wine Bar',              # Заголовок окна
        'http://127.0.0.1:5000',       # URL вашего Flask-приложения
        width=1280,                    # Ширина окна
        height=800,                    # Высота окна
        resizable=True,                # Разрешить изменять размер окна
        min_size=(800, 600)            # Минимальный размер окна
    )
    webview.start()