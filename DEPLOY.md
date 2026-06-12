# Деплой на Render

Проект уже Docker-ready: `Dockerfile` → `entrypoint.sh` (`python database.py` инициализирует БД → gunicorn).

## 1. Переменные окружения (Render → Environment)

| Переменная | Значение | Зачем |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | токен @Felizcombot (лучше новый после `/revoke`) | бот шлёт заказы |
| `TELEGRAM_WEBHOOK_SECRET` | случайная строка (32+ симв.) | защита webhook |
| `DATABASE_URL` | URL Render PostgreSQL | **заказы не теряются** при редеплое |
| `DEFAULT_ADMIN_PASSWORD` | надёжный пароль (НЕ `123`) | вход в админку |
| `DEFAULT_ADMIN_EMAIL` | твой email админа | вход в админку |
| `FLASK_SECRET_KEY` | случайная строка | сессии/безопасность |
| `SESSION_COOKIE_SECURE` | `true` | cookie только по https |

> ⚠️ **Без `DATABASE_URL` (Postgres)** Render использует SQLite, который **стирается при каждом редеплое** — заказы и статистика пропадут. Для persist заказов — обязательно Postgres.

## 2. База данных

- **Свежий Postgres** (рекомендую): при первом старте меню (112 товаров) сидится автоматически из `menu_source.json`, админ создаётся с `DEFAULT_ADMIN_PASSWORD`. Чисто.
- **Существующая БД со старым меню**: автосид не сработает (меню не пустое). Обнови меню вручную — выполни на сервере:
  ```
  python import_menu.py
  ```
  (перезапишет `menu_items` из `menu_source.json`). Новые колонки заказов (`order_type`, `table_number`, `claimed_by`, …) добавятся сами через `ensure_schema_upgrades()`.

## 3. После деплоя — webhook + команды бота

Запусти локально (или в Render Shell), указав прод-URL:
```
TELEGRAM_BOT_TOKEN=<токен> \
TELEGRAM_WEBHOOK_SECRET=<тот же секрет что в Render> \
WEBHOOK_URL=https://felizwinebar.md/telegram/webhook \
python3 set_webhook.py
```
Это поставит webhook + зарегистрирует меню-команды (`/livrare`, `/feliz`, `/free`, `/profile`, `/name`). После этого **нажатия в боте заработают**.

Проверка: `https://api.telegram.org/bot<токен>/getWebhookInfo` → `url` должен быть прод-адрес.

## 4. НЕ заливать на сервер (секреты/локальное)

- `local_config.env` (содержит токен) — только локально
- `run_local.sh` — только локально
- `instance/` — локальная SQLite

## 5. Чек-лист безопасности перед публикацией

- [ ] `DEFAULT_ADMIN_PASSWORD` ≠ `123`
- [ ] `TELEGRAM_WEBHOOK_SECRET` задан и совпадает в Render и в `set_webhook.py`
- [ ] новый токен бота (старый засвечен в чате)
- [ ] `DATABASE_URL` = Postgres (persist)
- [ ] `FLASK_SECRET_KEY` случайный
