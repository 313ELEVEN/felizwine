from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

from flask import Flask

from models import Advertisement, BotAdmin, Label, MenuItem, Order, PageContent, User, db


LEGACY_SQLITE_PATH = Path("feliz_wine_bar.db")
LEGACY_MENU_FILE = Path("apikey.txt")

DEFAULT_MENU_PAGE = {
    "hero_eyebrow": "Feliz Wine Bar",
    "hero_title": "Искусство вкуса и современной кухни",
    "hero_subtitle": (
        "Ресторанное меню, спецпредложения и рекламные блоки "
        "теперь управляются через админ-панель и хранятся в базе данных."
    ),
    "ads_title": "Спецпредложения и события",
    "ads_subtitle": "Горизонтальная лента поддерживает автоскролл и ручную прокрутку.",
    "menu_title": "Меню ресторана",
    "menu_subtitle": "Премиальная подача, чистая структура и быстрый заказ с любого устройства.",
}

DEFAULT_LABELS = [
    {"name": "Hot", "slug": "hot", "emoji": "🔥", "color": "#D4552D", "sort_order": 10},
    {
        "name": "Best Price",
        "slug": "best-price",
        "emoji": None,
        "color": "#2F7C67",
        "sort_order": 20,
    },
    {"name": "New", "slug": "new", "emoji": None, "color": "#4B5CC4", "sort_order": 30},
]

DEFAULT_ADVERTISEMENTS = [
    {
        "title": "Авторские ужины",
        "description": "Новые вечерние сеты с акцентом на морепродукты и бокальные вина.",
        "image_url": "/static/images/image1.jpg",
        "cta_text": "Открыть меню",
        "cta_url": "/menu",
        "sort_order": 10,
    },
    {
        "title": "Лёгкие завтраки",
        "description": "Утренняя подача, кофе и быстрый сервис для гостей на вынос и в зале.",
        "image_url": "/static/images/image2.png",
        "cta_text": "Посмотреть завтрак",
        "cta_url": "/menu",
        "sort_order": 20,
    },
    {
        "title": "Винная карта",
        "description": "Белые, красные и игристые позиции можно продвигать отдельно прямо из админки.",
        "image_url": "/static/images/image3.png",
        "cta_text": "Смотреть вина",
        "cta_url": "/menu",
        "sort_order": 30,
    },
]


def _default_sqlite_uri(app: Flask) -> str:
    instance_dir = Path(app.instance_path)
    instance_dir.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{instance_dir / 'felizwine_local.db'}"


def get_configured_database_url(app: Flask) -> str:
    configured_url = os.getenv("DATABASE_URL", "").strip()
    if configured_url:
        if configured_url.startswith("postgres://"):
            configured_url = configured_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif configured_url.startswith("postgresql://") and "+psycopg" not in configured_url:
            configured_url = configured_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return configured_url
    return _default_sqlite_uri(app)


def configure_database(app: Flask) -> None:
    app.config["SQLALCHEMY_DATABASE_URI"] = get_configured_database_url(app)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}
    db.init_app(app)


def init_database(app: Flask) -> None:
    configure_database(app)
    with app.app_context():
        db.create_all()
        migrate_legacy_data()
        seed_defaults()
        db.session.commit()


def _current_sqlite_path() -> Path | None:
    database_uri = db.engine.url.render_as_string(hide_password=False)
    if database_uri.startswith("sqlite:///"):
        return Path(database_uri.replace("sqlite:///", "", 1)).resolve()
    return None


def _parse_datetime(raw_value: Any) -> datetime | None:
    if not raw_value:
        return None
    if isinstance(raw_value, datetime):
        return raw_value
    raw_string = str(raw_value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(raw_string)
    except ValueError:
        return None


def _safe_json(raw_value: Any, fallback: Any) -> Any:
    if raw_value in (None, ""):
        return fallback


def _row_value(row: sqlite3.Row, key: str) -> Any:
    return row[key] if key in row.keys() else None
    if isinstance(raw_value, (dict, list)):
        return raw_value
    try:
        return json.loads(raw_value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def migrate_legacy_data() -> None:
    current_sqlite_path = _current_sqlite_path()
    if current_sqlite_path and LEGACY_SQLITE_PATH.exists() and current_sqlite_path == LEGACY_SQLITE_PATH.resolve():
        return

    migrated_anything = False
    if LEGACY_SQLITE_PATH.exists():
        migrated_anything = migrate_from_legacy_sqlite(LEGACY_SQLITE_PATH) or migrated_anything
    if MenuItem.query.count() == 0 and LEGACY_MENU_FILE.exists():
        migrated_anything = import_menu_from_file(LEGACY_MENU_FILE) or migrated_anything
    if migrated_anything:
        db.session.flush()


def migrate_from_legacy_sqlite(source_path: Path) -> bool:
    migrated = False
    connection = sqlite3.connect(source_path)
    connection.row_factory = sqlite3.Row

    user_map: dict[int, int] = {}
    try:
        if User.query.count() == 0:
            for row in connection.execute("SELECT * FROM users ORDER BY id"):
                existing = User.query.filter_by(email=row["email"]).first()
                if existing:
                    user_map[row["id"]] = existing.id
                    continue
                user = User(
                    name=row["name"],
                    email=row["email"],
                    phone=row["phone"],
                    password=row["password"],
                    is_admin=bool(row["is_admin"]),
                    created_at=_parse_datetime(_row_value(row, "created_at")) or datetime.utcnow(),
                    updated_at=_parse_datetime(_row_value(row, "updated_at")) or datetime.utcnow(),
                )
                db.session.add(user)
                db.session.flush()
                user_map[row["id"]] = user.id
                migrated = True
        else:
            for user in User.query.all():
                user_map[user.id] = user.id

        if MenuItem.query.count() == 0:
            for row in connection.execute("SELECT * FROM menu_items ORDER BY id"):
                item = MenuItem(
                    name=row["name"],
                    description=row["description"],
                    price=float(row["price"] or 0),
                    category=row["category"],
                    image_url=row["image_url"],
                    is_food=bool(row["is_food"]),
                    visible=True,
                    sort_order=0,
                    details={"legacy_id": row["id"]},
                    created_at=_parse_datetime(_row_value(row, "created_at")) or datetime.utcnow(),
                    updated_at=_parse_datetime(_row_value(row, "updated_at")) or datetime.utcnow(),
                )
                db.session.add(item)
                migrated = True

        if Order.query.count() == 0:
            for row in connection.execute("SELECT * FROM orders ORDER BY id"):
                order = Order(
                    user_id=user_map.get(row["user_id"]) if row["user_id"] else None,
                    customer_name=row["customer_name"],
                    customer_phone=row["customer_phone"],
                    customer_address=row["customer_address"],
                    order_details=_safe_json(row["order_details"], []),
                    total_price=float(row["total_price"] or 0),
                    status=row["status"] or "Новый",
                    created_at=_parse_datetime(row["created_at"]) or datetime.utcnow(),
                    updated_at=_parse_datetime(_row_value(row, "updated_at")) or datetime.utcnow(),
                )
                db.session.add(order)
                migrated = True
    finally:
        connection.close()

    return migrated


def import_menu_from_file(source_path: Path) -> bool:
    if not source_path.exists():
        return False

    food_categories = {
        "Завтрак / Breakfast",
        "Супы / Soups",
        "Закуски / Appetizers",
        "Салаты / Salads",
        "Морепродукты и Рыба / Seafood and Fish",
        "Паста / Pasta",
        "Мясные блюда / Meat Dishes",
        "Бургеры и другое / Burgers & More",
        "Десерты / Desserts",
    }

    current_category = ""
    inserted_rows = 0
    with source_path.open("r", encoding="utf-8") as menu_file:
        pending_lines = iter(menu_file)
        for raw_line in pending_lines:
            line = raw_line.strip()
            if not line:
                continue

            if "/" in line and " - " not in line and not any(char.isdigit() for char in line):
                current_category = line
                continue

            if " - " not in line or not current_category:
                continue

            name_part, price_part = line.rsplit(" - ", 1)
            description = next(pending_lines, "").strip()
            try:
                price_value = float(price_part.replace("MDL", "").strip())
            except ValueError:
                price_value = 0.0

            item = MenuItem(
                name=name_part.strip(),
                description=description or None,
                price=price_value,
                category=current_category,
                image_url=None,
                is_food=current_category in food_categories,
                visible=True,
                sort_order=inserted_rows,
                details={"source": "apikey.txt"},
            )
            db.session.add(item)
            inserted_rows += 1

    return inserted_rows > 0


def seed_defaults() -> None:
    seed_admin_user()
    seed_labels()
    seed_page_content()
    seed_advertisements()
    assign_demo_labels()


def seed_admin_user() -> None:
    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@feliz.md")
    if User.query.filter_by(email=admin_email).first():
        return

    admin_user = User(
        name=os.getenv("DEFAULT_ADMIN_NAME", "Admin"),
        email=admin_email,
        phone=os.getenv("DEFAULT_ADMIN_PHONE", "123456789"),
        password=os.getenv("DEFAULT_ADMIN_PASSWORD", "123"),
        is_admin=True,
    )
    db.session.add(admin_user)


def seed_labels() -> None:
    for label_data in DEFAULT_LABELS:
        if Label.query.filter_by(slug=label_data["slug"]).first():
            continue
        db.session.add(Label(**label_data))


def seed_page_content() -> None:
    if PageContent.query.filter_by(key="menu_page").first():
        return

    page = PageContent(
        key="menu_page",
        title="Меню ресторана",
        subtitle="Контент этой страницы хранится в базе и меняется через админку.",
        payload=DEFAULT_MENU_PAGE,
    )
    db.session.add(page)


def seed_advertisements() -> None:
    if Advertisement.query.count() > 0:
        return
    for ad_data in DEFAULT_ADVERTISEMENTS:
        db.session.add(Advertisement(**ad_data))


def assign_demo_labels() -> None:
    if MenuItem.query.filter(MenuItem.label_id.isnot(None)).first():
        return

    hot_label = Label.query.filter_by(slug="hot").first()
    best_price_label = Label.query.filter_by(slug="best-price").first()
    new_label = Label.query.filter_by(slug="new").first()

    expensive_food = (
        MenuItem.query.filter_by(is_food=True, visible=True)
        .order_by(MenuItem.price.desc(), MenuItem.id.asc())
        .first()
    )
    best_price = (
        MenuItem.query.filter_by(visible=True)
        .order_by(MenuItem.price.asc(), MenuItem.id.asc())
        .first()
    )
    latest_item = MenuItem.query.order_by(MenuItem.created_at.desc(), MenuItem.id.desc()).first()

    if hot_label and expensive_food:
        expensive_food.label = hot_label
    if best_price_label and best_price and best_price.id != getattr(expensive_food, "id", None):
        best_price.label = best_price_label
    if new_label and latest_item and latest_item.id not in {getattr(expensive_food, "id", None), getattr(best_price, "id", None)}:
        latest_item.label = new_label


if __name__ == "__main__":
    bootstrap_app = Flask(__name__)
    configure_database(bootstrap_app)
    with bootstrap_app.app_context():
        db.create_all()
        migrate_legacy_data()
        seed_defaults()
        db.session.commit()
    print(f"Database initialized: {bootstrap_app.config['SQLALCHEMY_DATABASE_URI']}")
