from __future__ import annotations

import os
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Any

import requests
from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_cors import CORS
from functools import wraps
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from database import init_database
from models import Advertisement, BotAdmin, Label, MenuItem, Order, PageContent, User, db


def env_flag(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return str(raw_value).strip().lower() in {"1", "true", "yes", "on"}


FLASK_ENV = (os.getenv("FLASK_ENV") or "").strip().lower()
IS_RENDER = any(os.getenv(name) for name in ("RENDER", "RENDER_SERVICE_ID", "RENDER_EXTERNAL_URL"))
IS_PRODUCTION = FLASK_ENV == "production" or IS_RENDER
SECRET_KEY = os.getenv("FLASK_SECRET_KEY") or os.getenv("SECRET_KEY") or "feliz-dev-secret-key"

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
CORS(app)
app.config.update(
    SECRET_KEY=SECRET_KEY,
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,
    PREFERRED_URL_SCHEME="https",
    SESSION_COOKIE_SECURE=env_flag("SESSION_COOKIE_SECURE", IS_PRODUCTION),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_REFRESH_EACH_REQUEST=True,
)
session_cookie_domain = (os.getenv("SESSION_COOKIE_DOMAIN") or "").strip() or None
if session_cookie_domain:
    app.config["SESSION_COOKIE_DOMAIN"] = session_cookie_domain
app.secret_key = app.config["SECRET_KEY"]

init_database(app)


BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "7075151658:AAH9MK6jyguU3BA5J8yK5ZDy5rMYba_9Hgg")
CHAT_IDS = [
    chat_id.strip()
    for chat_id in os.getenv(
        "TELEGRAM_CHAT_IDS",
        "310936025,7255973106,6113861296,1522735375,2116037251",
    ).split(",")
    if chat_id.strip()
]

FOOD_CATEGORY_ORDER = [
    "Завтрак / Breakfast",
    "Супы / Soups",
    "Закуски / Appetizers",
    "Салаты / Salads",
    "Морепродукты и Рыба / Seafood and Fish",
    "Паста / Pasta",
    "Мясные блюда / Meat Dishes",
    "Бургеры и другое / Burgers & More",
    "Десерты / Desserts",
]

DRINK_CATEGORY_ORDER = [
    "Кофе / Coffee",
    "Чай / Tea",
    "Соки и Вода / Juices & Water",
    "Пиво и закуски / Beer & Snacks",
    "Безалкогольные коктейли / Non-alcoholic cocktails",
    "Алкогольные коктейли / Alcoholic cocktails",
    "Виски / Whisky",
    "Коньяк / Divin",
    "Игристые / Sparkling",
    "Белые вина / White Wines",
    "Розовые вина / Rosé Wines",
    "Красные вина / Red Wines",
]

CATEGORY_ORDER = FOOD_CATEGORY_ORDER + DRINK_CATEGORY_ORDER
FOOD_CATEGORY_SET = set(FOOD_CATEGORY_ORDER)
DRINK_CATEGORY_SET = set(DRINK_CATEGORY_ORDER)
COUNTRY_ALIASES = {
    "CZ": "CZ",
    "CZE": "CZ",
    "CZECHIA": "CZ",
    "CZECH REPUBLIC": "CZ",
    "ЧЕХИЯ": "CZ",
    "ЧЕШСКАЯ РЕСПУБЛИКА": "CZ",
    "MD": "MD",
    "MDA": "MD",
    "MOLDOVA": "MD",
    "REPUBLIC OF MOLDOVA": "MD",
    "МОЛДОВА": "MD",
    "РЕСПУБЛИКА МОЛДОВА": "MD",
}
COUNTRY_HEADER_CANDIDATES = (
    "CF-IPCountry",
    "CloudFront-Viewer-Country",
    "X-Vercel-IP-Country",
    "X-Appengine-Country",
    "X-Country-Code",
)


def infer_menu_type(category: str | None) -> bool | None:
    if not category:
        return None
    if category in FOOD_CATEGORY_SET:
        return True
    if category in DRINK_CATEGORY_SET:
        return False
    return None


def normalize_country_code(value: Any) -> str | None:
    if value is None:
        return None
    raw_value = str(value).strip().upper()
    if not raw_value:
        return None
    if raw_value in {"XX", "ZZ", "UNKNOWN"}:
        return None
    if raw_value in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[raw_value]
    if len(raw_value) == 2 and raw_value.isalpha():
        return raw_value
    return None


def detect_request_country_code() -> str | None:
    query_country = normalize_country_code(request.args.get("country"))
    if query_country:
        return query_country

    for header_name in COUNTRY_HEADER_CANDIDATES:
        header_country = normalize_country_code(request.headers.get(header_name))
        if header_country:
            return header_country

    return None


def allowed_countries_from_payload(payload: Any) -> list[str]:
    if not isinstance(payload, dict):
        return []
    raw_value = payload.get("allowed_countries")
    if isinstance(raw_value, str):
        source_values = [part.strip() for part in raw_value.split(",")]
    elif isinstance(raw_value, list):
        source_values = raw_value
    else:
        return []

    result: list[str] = []
    for item in source_values:
        country = normalize_country_code(item)
        if country and country not in result:
            result.append(country)
    return result


def send_telegram_notification(order_data: dict[str, Any]) -> None:
    try:
        # Get active bot admins from DB
        active_admins = BotAdmin.query.filter_by(is_active=True).all()
        chat_ids = [admin.chat_id for admin in active_admins]
        
        # If no admins in DB, fallback to environment variable CHAT_IDS
        if not chat_ids:
            chat_ids = CHAT_IDS

        total_price = sum(
            float(item.get("price", 0)) * int(item.get("quantity", 1))
            for item in order_data.get("cart", [])
        )
        message = (
            f"🎉 *Comanda noua! #{order_data.get('order_id')}* 🎉\n\n"
            f"👤 *Numele clientului:* {order_data.get('name')}\n"
            f"📞 *Numar mobil:* {order_data.get('phone')}\n"
            f"📍 *Adresa livrarii:* {order_data.get('address')}\n\n"
            f"🛒 *Comanda de:*\n"
        )
        for item in order_data.get("cart", []):
            message += f"• {item.get('name')} x {item.get('quantity')} - {item.get('price')} MDL\n"
        
        message += f"\n💰 *Total:* {total_price:.0f} MDL"

        if not BOT_TOKEN or not chat_ids:
            return

        for chat_id in chat_ids:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown",
            }
            requests.post(url, json=payload, timeout=10)
    except Exception as e:
        app.logger.error("Telegram notification error: %s", e)


def wants_json_response() -> bool:
    if request.args.get("format") == "json":
        return True
    if request.path.startswith("/api/"):
        return True
    best = request.accept_mimetypes.best
    return best == "application/json" and (
        request.accept_mimetypes[best] >= request.accept_mimetypes["text/html"]
    )


def parse_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def build_password(raw_password: str) -> str:
    return generate_password_hash(raw_password)


def verify_password(stored_password: str, raw_password: str) -> bool:
    if stored_password.startswith(("pbkdf2:", "scrypt:")):
        return check_password_hash(stored_password, raw_password)
    return stored_password == raw_password


def current_user() -> User | None:
    user_id = session.get("user_id")
    if not user_id:
        return None
    return db.session.get(User, user_id)


def build_auth_redirect_url(user: User) -> str:
    return url_for("admin_dashboard") if user.is_admin else url_for("profile")


def store_user_session(user: User) -> None:
    session.clear()
    session["user_id"] = user.id
    session["is_admin"] = bool(user.is_admin)
    session.permanent = True
    session.modified = True


def auth_success_response(user: User):
    redirect_url = build_auth_redirect_url(user)
    if request.path.startswith("/api/") or request.is_json or wants_json_response():
        return jsonify({"success": True, "user": serialize_user(user), "redirect_url": redirect_url})
    return redirect(redirect_url)


def admin_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if not session.get("is_admin"):
            if request.method != "GET" or request.is_json or wants_json_response():
                return jsonify({"success": False, "message": "Требуются права администратора."}), 403
            return redirect(url_for("menu"))
        return view(*args, **kwargs)

    return wrapped_view


def serialize_label(label: Label | None) -> dict[str, Any] | None:
    if not label:
        return None
    badge_text = f"{label.emoji} {label.name}".strip() if label.emoji else label.name
    return {
        "id": label.id,
        "name": label.name,
        "slug": label.slug,
        "emoji": label.emoji,
        "color": label.color,
        "visible": label.visible,
        "sort_order": label.sort_order,
        "payload": label.payload or {},
        "badge_text": badge_text,
    }


def serialize_menu_item(item: MenuItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description or "",
        "price": round(float(item.price or 0), 2),
        "category": item.category,
        "image_url": item.image_url,
        "is_food": bool(item.is_food),
        "visible": bool(item.visible),
        "sort_order": item.sort_order,
        "details": item.details or {},
        "label_id": item.label_id,
        "label": serialize_label(item.label) if item.label and item.label.visible else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_advertisement(advertisement: Advertisement) -> dict[str, Any]:
    payload = advertisement.payload or {}
    return {
        "id": advertisement.id,
        "title": advertisement.title,
        "description": advertisement.description or "",
        "image_url": advertisement.image_url,
        "cta_text": advertisement.cta_text or "",
        "cta_url": advertisement.cta_url or "",
        "visible": bool(advertisement.visible),
        "sort_order": advertisement.sort_order,
        "payload": payload,
        "allowed_countries": allowed_countries_from_payload(payload),
        "updated_at": advertisement.updated_at.isoformat() if advertisement.updated_at else None,
    }


def serialize_page_content(page_content: PageContent | None) -> dict[str, Any]:
    if not page_content:
        return {"key": "menu_page", "title": "", "subtitle": "", "visible": True, "payload": {}}
    return {
        "key": page_content.key,
        "title": page_content.title or "",
        "subtitle": page_content.subtitle or "",
        "visible": bool(page_content.visible),
        "payload": page_content.payload or {},
        "updated_at": page_content.updated_at.isoformat() if page_content.updated_at else None,
    }


def serialize_order(order: Order) -> dict[str, Any]:
    return {
        "id": order.id,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "customer_address": order.customer_address,
        "order_details": order.order_details or [],
        "total_price": round(float(order.total_price or 0), 2),
        "status": order.status,
        "user_email": order.user.email if order.user else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


def serialize_user(user: User | None) -> dict[str, Any] | None:
    if not user:
        return None
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "is_admin": bool(user.is_admin),
    }


def sorted_categories(items_by_category: dict[str, list[dict[str, Any]]], is_food: bool | None = None) -> list[str]:
    if is_food is True:
        base_order = FOOD_CATEGORY_ORDER
    elif is_food is False:
        base_order = DRINK_CATEGORY_ORDER
    else:
        base_order = CATEGORY_ORDER
    ordered = [category for category in base_order if category in items_by_category]
    remaining = sorted(category for category in items_by_category if category not in CATEGORY_ORDER)
    return ordered + remaining


def build_menu_payload(is_food: bool | None = None, include_hidden: bool = False) -> list[dict[str, Any]]:
    query = MenuItem.query
    if is_food is not None:
        query = query.filter_by(is_food=is_food)
    if not include_hidden:
        query = query.filter_by(visible=True)

    items = query.order_by(MenuItem.category.asc(), MenuItem.sort_order.asc(), MenuItem.name.asc()).all()
    menu_by_category: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        inferred_type = infer_menu_type(item.category)
        if is_food is not None and inferred_type is not None and inferred_type is not is_food:
            continue
        menu_by_category[item.category].append(serialize_menu_item(item))

    return [
        {"category": category, "items": menu_by_category[category]}
        for category in sorted_categories(menu_by_category, is_food)
    ]


def apply_menu_item_payload(item: MenuItem, payload: dict[str, Any]) -> MenuItem:
    category = payload.get("new_category") or payload.get("category") or item.category
    label_id = payload.get("label_id")

    item.name = (payload.get("name") or item.name or "Новый товар").strip()
    item.description = (payload.get("description") or "").strip() or None
    item.price = to_float(payload.get("price"), item.price or 0.0)
    item.category = category.strip() if isinstance(category, str) else item.category
    item.image_url = (payload.get("image_url") or "").strip() or None
    inferred_type = infer_menu_type(item.category)
    item.is_food = inferred_type if inferred_type is not None else parse_bool(payload.get("is_food"), item.is_food)
    item.visible = parse_bool(payload.get("visible"), item.visible if item.id else True)
    item.sort_order = to_int(payload.get("sort_order"), item.sort_order or 0)
    item.details = payload.get("details") if isinstance(payload.get("details"), dict) else (item.details or {})

    if label_id in ("", None, "null"):
        item.label = None
        item.label_id = None
    else:
        item.label = Label.query.get(to_int(label_id))
    return item


def apply_label_payload(label: Label, payload: dict[str, Any]) -> Label:
    raw_name = (payload.get("name") or label.name or "Новый бейдж").strip()
    label.name = raw_name
    slug = (payload.get("slug") or raw_name.lower().replace(" ", "-")).strip() or f"label-{uuid.uuid4().hex[:8]}"
    existing_query = Label.query.filter(Label.slug == slug)
    if label.id:
        existing_query = existing_query.filter(Label.id != label.id)
    existing = existing_query.first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    label.slug = slug
    label.emoji = (payload.get("emoji") or "").strip() or None
    label.color = (payload.get("color") or label.color or "#D4AF37").strip()
    label.visible = parse_bool(payload.get("visible"), label.visible if label.id else True)
    label.sort_order = to_int(payload.get("sort_order"), label.sort_order or 0)
    label.payload = payload.get("payload") if isinstance(payload.get("payload"), dict) else (label.payload or {})
    return label


def apply_ad_payload(advertisement: Advertisement, payload: dict[str, Any]) -> Advertisement:
    advertisement.title = (payload.get("title") or advertisement.title or "Новый баннер").strip()
    advertisement.description = (payload.get("description") or "").strip() or None
    advertisement.image_url = (payload.get("image_url") or "").strip() or None
    advertisement.cta_text = (payload.get("cta_text") or "").strip() or None
    advertisement.cta_url = (payload.get("cta_url") or "").strip() or None
    advertisement.visible = parse_bool(payload.get("visible"), advertisement.visible if advertisement.id else True)
    advertisement.sort_order = to_int(payload.get("sort_order"), advertisement.sort_order or 0)
    advertisement.payload = payload.get("payload") if isinstance(payload.get("payload"), dict) else (advertisement.payload or {})
    return advertisement


def advertisement_visible_for_country(ad_payload: dict[str, Any], country_code: str | None) -> bool:
    allowed_countries = ad_payload.get("allowed_countries") or allowed_countries_from_payload(ad_payload.get("payload"))
    if not allowed_countries:
        return True
    if not country_code:
        return False
    return country_code in allowed_countries


def apply_page_content_payload(page_content: PageContent, payload: dict[str, Any]) -> PageContent:
    page_content.title = (payload.get("title") or "").strip() or None
    page_content.subtitle = (payload.get("subtitle") or "").strip() or None
    page_content.visible = parse_bool(payload.get("visible"), page_content.visible if page_content.id else True)
    page_content.payload = payload.get("payload") if isinstance(payload.get("payload"), dict) else (page_content.payload or {})
    return page_content


def parse_is_food_argument() -> bool | None:
    raw_value = request.args.get("is_food")
    if raw_value is None:
        return None
    return parse_bool(raw_value, True)


def commit_session() -> None:
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def add_vary_header(response, header_name: str):
    current_value = response.headers.get("Vary", "")
    vary_values = {item.strip() for item in current_value.split(",") if item.strip()}
    vary_values.add(header_name)
    response.headers["Vary"] = ", ".join(sorted(vary_values))
    return response


def disable_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.after_request
def apply_response_headers(response):
    path = request.path or "/"

    # 🔑 определяем авторизацию ПРАВИЛЬНО
    is_logged_in = session.get("user_id") is not None

    # 🔥 ВСЕГДА добавляем Vary (ОЧЕНЬ ВАЖНО ДЛЯ CLOUDFLARE)
    response.headers["Vary"] = "Cookie"

    # 🔒 ЕСЛИ ЗАЛОГИНЕН — НИКАКОГО КЭША ВООБЩЕ
    if is_logged_in:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    # ⚡ КЭШ ТОЛЬКО ДЛЯ ГОСТЕЙ И ТОЛЬКО /menu
    if path.startswith("/menu"):
        response.headers["Cache-Control"] = "public, max-age=31536000"
        response.headers.pop("Pragma", None)
        response.headers.pop("Expires", None)
        return response

    # 🔒 АДМИН / AUTH ВСЕГДА БЕЗ КЭША
    auth_sensitive_prefixes = ("/admin",)
    auth_sensitive_paths = {
        "/login", "/register", "/profile",
        "/api/login", "/api/register", "/api/logout"
    }

    if path in auth_sensitive_paths or path.startswith(auth_sensitive_prefixes):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    return response


def dashboard_state() -> dict[str, Any]:
    return {
        "menu_items": [serialize_menu_item(item) for item in MenuItem.query.order_by(MenuItem.category.asc(), MenuItem.sort_order.asc(), MenuItem.name.asc()).all()],
        "labels": [serialize_label(label) for label in Label.query.order_by(Label.sort_order.asc(), Label.name.asc()).all()],
        "ads": [serialize_advertisement(advertisement) for advertisement in Advertisement.query.order_by(Advertisement.sort_order.asc(), Advertisement.id.asc()).all()],
        "orders": [serialize_order(order) for order in Order.query.order_by(Order.id.desc()).limit(100).all()],
        "bot_admins": [serialize_bot_admin(admin) for admin in BotAdmin.query.order_by(BotAdmin.id.desc()).all()],
        "page_content": serialize_page_content(PageContent.query.filter_by(key="menu_page").first()),
    }


@app.route("/")
def home():
    return render_template("index.html", user_info=serialize_user(current_user()))


@app.route("/menu", methods=["GET"])
def menu():
    if wants_json_response():
        return jsonify(build_menu_payload(parse_is_food_argument()))
    return render_template(
        "menu.html",
        user_info=serialize_user(current_user()),
        page_content=serialize_page_content(PageContent.query.filter_by(key="menu_page").first()),
        geo_info={"countryCode": detect_request_country_code()},
    )


@app.route("/menu", methods=["POST"])
@admin_required
def create_menu_item():
    payload = request.get_json(silent=True) or {}
    item = apply_menu_item_payload(
        MenuItem(
            name="Новый товар",
            category=payload.get("category") or payload.get("new_category") or "Новая категория",
            price=0.0,
            visible=True,
            is_food=parse_bool(payload.get("is_food"), True),
        ),
        payload,
    )
    db.session.add(item)
    commit_session()
    return jsonify({"success": True, "item": serialize_menu_item(item)}), 201


@app.route("/menu", methods=["PUT"])
@admin_required
def update_menu_item_from_body():
    payload = request.get_json(silent=True) or {}
    item_id = to_int(payload.get("id"))
    item = MenuItem.query.get_or_404(item_id)
    apply_menu_item_payload(item, payload)
    commit_session()
    return jsonify({"success": True, "item": serialize_menu_item(item)})


@app.route("/menu/<int:item_id>", methods=["PUT", "PATCH", "DELETE"])
@admin_required
def menu_item_detail(item_id: int):
    item = MenuItem.query.get_or_404(item_id)
    if request.method == "DELETE":
        db.session.delete(item)
        commit_session()
        return jsonify({"success": True})
    payload = request.get_json(silent=True) or {}
    apply_menu_item_payload(item, payload)
    commit_session()
    return jsonify({"success": True, "item": serialize_menu_item(item)})


@app.route("/api/get_menu")
def get_menu():
    return jsonify(build_menu_payload(parse_bool(request.args.get("is_food", 1), True)))


@app.route("/api/menu")
def api_menu_alias():
    return jsonify(build_menu_payload(parse_is_food_argument()))


@app.route("/ads", methods=["GET"])
@app.route("/api/ads", methods=["GET"])
def ads():
    show_hidden = parse_bool(request.args.get("show_hidden"), False) and bool(session.get("is_admin"))
    preview_mode = parse_bool(request.args.get("preview"), False) and bool(session.get("is_admin"))
    country_code = detect_request_country_code()
    query = Advertisement.query
    if not show_hidden:
        query = query.filter_by(visible=True)
    ads_payload = [
        serialize_advertisement(advertisement)
        for advertisement in query.order_by(Advertisement.sort_order.asc(), Advertisement.id.asc()).all()
    ]
    if not show_hidden and not preview_mode:
        ads_payload = [
            advertisement
            for advertisement in ads_payload
            if advertisement_visible_for_country(advertisement, country_code)
        ]
    return jsonify(ads_payload)


@app.route("/ads", methods=["POST"])
@admin_required
def create_ad():
    payload = request.get_json(silent=True) or {}
    advertisement = apply_ad_payload(Advertisement(title="Новый баннер"), payload)
    db.session.add(advertisement)
    commit_session()
    return jsonify({"success": True, "ad": serialize_advertisement(advertisement)}), 201


@app.route("/ads", methods=["PUT"])
@admin_required
def update_ad_from_body():
    payload = request.get_json(silent=True) or {}
    ad_id = to_int(payload.get("id"))
    advertisement = Advertisement.query.get_or_404(ad_id)
    apply_ad_payload(advertisement, payload)
    commit_session()
    return jsonify({"success": True, "ad": serialize_advertisement(advertisement)})


@app.route("/ads/<int:ad_id>", methods=["PUT", "PATCH", "DELETE"])
@admin_required
def ad_detail(ad_id: int):
    advertisement = Advertisement.query.get_or_404(ad_id)
    if request.method == "DELETE":
        db.session.delete(advertisement)
        commit_session()
        return jsonify({"success": True})
    payload = request.get_json(silent=True) or {}
    apply_ad_payload(advertisement, payload)
    commit_session()
    return jsonify({"success": True, "ad": serialize_advertisement(advertisement)})


@app.route("/profile")
def profile():
    user = current_user()
    if not user:
        return redirect(url_for("menu"))
    orders = Order.query.filter_by(user_id=user.id).order_by(Order.id.desc()).all()
    return render_template("profile.html", user_info=user, orders=orders)


@app.route("/login", methods=["POST"])
@app.route("/api/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    email = (payload.get("email") or "").strip().lower()
    raw_password = payload.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(user.password, raw_password):
        return jsonify({"success": False, "message": "Неверный email или пароль."}), 401

    store_user_session(user)
    return auth_success_response(user)


@app.route("/register", methods=["POST"])
@app.route("/api/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or request.form.to_dict() or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""

    if not all([name, email, phone, password]):
        return jsonify({"success": False, "message": "Все поля обязательны для заполнения."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Пользователь с таким email уже существует."}), 409

    user = User(name=name, email=email, phone=phone, password=build_password(password), is_admin=False)
    db.session.add(user)
    commit_session()
    store_user_session(user)
    return auth_success_response(user)


@app.route("/admin/bot-admins", methods=["GET", "POST"])
@admin_required
def bot_admins_api():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        chat_id = str(payload.get("chat_id", "")).strip()
        name = str(payload.get("name", "")).strip()
        if not chat_id:
            return jsonify({"success": False, "message": "Chat ID обязателен."}), 400
        
        # Проверяем на уникальность перед созданием
        if BotAdmin.query.filter_by(chat_id=chat_id).first():
            return jsonify({"success": False, "message": f"Администратор с Chat ID {chat_id} уже существует."}), 409
            
        bot_admin = BotAdmin(chat_id=chat_id, name=name)
        db.session.add(bot_admin)
        commit_session()
        return jsonify({"success": True, "bot_admin": serialize_bot_admin(bot_admin)}), 201

    admins = BotAdmin.query.order_by(BotAdmin.id.desc()).all()
    return jsonify([serialize_bot_admin(a) for a in admins])


@app.route("/admin/bot-admins/<int:admin_id>", methods=["PATCH", "DELETE"])
@admin_required
def bot_admin_detail(admin_id: int):
    bot_admin = BotAdmin.query.get_or_404(admin_id)
    if request.method == "DELETE":
        db.session.delete(bot_admin)
        commit_session()
        return jsonify({"success": True})
    
    payload = request.get_json(silent=True) or {}
    
    # Если меняется chat_id, проверяем на уникальность (исключая текущего админа)
    if "chat_id" in payload:
        new_chat_id = str(payload["chat_id"]).strip()
        if not new_chat_id:
            return jsonify({"success": False, "message": "Chat ID не может быть пустым."}), 400
            
        existing = BotAdmin.query.filter(BotAdmin.chat_id == new_chat_id, BotAdmin.id != admin_id).first()
        if existing:
            return jsonify({"success": False, "message": f"Chat ID {new_chat_id} уже используется другим администратором."}), 409
        bot_admin.chat_id = new_chat_id

    if "name" in payload:
        bot_admin.name = str(payload["name"]).strip()
    if "is_active" in payload:
        bot_admin.is_active = bool(payload["is_active"])
        
    try:
        commit_session()
        return jsonify({"success": True, "bot_admin": serialize_bot_admin(bot_admin)})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


def serialize_bot_admin(admin: BotAdmin) -> dict:
    return {
        "id": admin.id,
        "chat_id": admin.chat_id,
        "name": admin.name,
        "is_active": admin.is_active,
        "created_at": admin.created_at.isoformat() if admin.created_at else None,
    }


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/place_order", methods=["POST"])
def place_order():
    payload = request.get_json(silent=True) or {}
    cart = payload.get("cart") or []
    if not all([payload.get("name"), payload.get("phone"), payload.get("address"), cart]):
        return jsonify({"success": False, "message": "Все поля обязательны и корзина не может быть пустой."}), 400

    total_price = sum(to_float(item.get("price")) * to_int(item.get("quantity"), 1) for item in cart)
    order = Order(
        user_id=session.get("user_id"),
        customer_name=payload["name"],
        customer_phone=payload["phone"],
        customer_address=payload["address"],
        order_details=cart,
        total_price=round(total_price, 2),
        status="Новый",
    )
    db.session.add(order)
    commit_session()

    try:
        send_telegram_notification({**payload, "order_id": order.id})
    except Exception as exc:
        app.logger.error("Failed to send Telegram notification for order %s: %s", order.id, exc)

    return jsonify({"success": True, "message": "Спасибо, ваш заказ принят!", "order_id": order.id})


@app.route("/admin/dashboard")
@admin_required
def admin_dashboard():
    page_content = serialize_page_content(PageContent.query.filter_by(key="menu_page").first())
    labels = [serialize_label(label) for label in Label.query.order_by(Label.sort_order.asc(), Label.name.asc()).all()]
    ads = [
        serialize_advertisement(advertisement)
        for advertisement in Advertisement.query.order_by(Advertisement.sort_order.asc(), Advertisement.id.asc()).all()
    ]
    menu_items = [
        serialize_menu_item(item)
        for item in MenuItem.query.order_by(MenuItem.category.asc(), MenuItem.sort_order.asc(), MenuItem.name.asc()).all()
    ]
    orders = [serialize_order(order) for order in Order.query.order_by(Order.id.desc()).limit(100).all()]
    categories = sorted({item["category"] for item in menu_items if item.get("category")})

    return render_template(
        "admin_dashboard.html",
        dashboard_state={
            "menu_items": menu_items,
            "labels": labels,
            "ads": ads,
            "orders": orders,
            "page_content": page_content,
        },
        menu_items=menu_items,
        labels=labels,
        ads=ads,
        orders=orders,
        categories=categories,
        page_content=page_content,
    )


@app.route("/admin/labels", methods=["POST"])
@admin_required
def create_label():
    payload = request.get_json(silent=True) or {}
    label = apply_label_payload(Label(name="Новый бейдж", slug=f"label-{uuid.uuid4().hex[:8]}"), payload)
    db.session.add(label)
    commit_session()
    return jsonify({"success": True, "label": serialize_label(label)}), 201


@app.route("/admin/labels/<int:label_id>", methods=["PATCH", "PUT", "DELETE"])
@admin_required
def label_detail(label_id: int):
    label = Label.query.get_or_404(label_id)
    if request.method == "DELETE":
        MenuItem.query.filter_by(label_id=label.id).update({"label_id": None})
        db.session.delete(label)
        commit_session()
        return jsonify({"success": True})

    payload = request.get_json(silent=True) or {}
    apply_label_payload(label, payload)
    commit_session()
    return jsonify({"success": True, "label": serialize_label(label)})


@app.route("/admin/menu-items", methods=["POST"])
@admin_required
def admin_create_menu_item():
    return create_menu_item()


@app.route("/admin/menu-items/<int:item_id>", methods=["PATCH", "PUT", "DELETE"])
@admin_required
def admin_menu_item_detail(item_id: int):
    return menu_item_detail(item_id)


@app.route("/admin/ads", methods=["POST"])
@admin_required
def admin_create_ad():
    return create_ad()


@app.route("/admin/ads/<int:ad_id>", methods=["PATCH", "PUT", "DELETE"])
@admin_required
def admin_ad_detail(ad_id: int):
    return ad_detail(ad_id)


@app.route("/admin/page-content/<string:key>", methods=["PUT", "PATCH"])
@admin_required
def update_page_content(key: str):
    payload = request.get_json(silent=True) or {}
    page_content = PageContent.query.filter_by(key=key).first()
    if not page_content:
        page_content = PageContent(key=key)
        db.session.add(page_content)
    apply_page_content_payload(page_content, payload)
    commit_session()
    return jsonify({"success": True, "page_content": serialize_page_content(page_content)})


@app.route("/admin/orders/<int:order_id>", methods=["PATCH", "PUT", "DELETE"])
@admin_required
def admin_order_detail(order_id: int):
    order = Order.query.get_or_404(order_id)
    if request.method == "DELETE":
        db.session.delete(order)
        commit_session()
        return jsonify({"success": True})

    payload = request.get_json(silent=True) or {}
    new_status = payload.get("status")
    if new_status:
        order.status = new_status
    commit_session()
    return jsonify({"success": True, "order": serialize_order(order)})


@app.route("/admin/upload", methods=["POST"])
@admin_required
def admin_upload():
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"success": False, "message": "Файл не передан."}), 400

    uploads_dir = Path(app.static_folder) / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    original_name = secure_filename(file.filename)
    extension = Path(original_name).suffix or ".bin"
    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = uploads_dir / filename
    file.save(file_path)
    return jsonify({"success": True, "url": url_for("static", filename=f"uploads/{filename}")})


@app.route("/admin/get_menu_item/<int:item_id>")
@admin_required
def get_menu_item_by_id(item_id: int):
    item = MenuItem.query.get_or_404(item_id)
    return jsonify({"success": True, "item": serialize_menu_item(item)})


@app.route("/admin/add_menu_item", methods=["POST"])
@admin_required
def legacy_add_menu_item():
    return create_menu_item()


@app.route("/admin/edit_menu_item/<int:item_id>", methods=["POST"])
@admin_required
def legacy_edit_menu_item(item_id: int):
    item = MenuItem.query.get_or_404(item_id)
    payload = request.get_json(silent=True) or {}
    apply_menu_item_payload(item, payload)
    commit_session()
    return jsonify({"success": True, "item": serialize_menu_item(item)})


@app.route("/admin/delete_menu_item/<int:item_id>", methods=["POST"])
@admin_required
def legacy_delete_menu_item(item_id: int):
    item = MenuItem.query.get_or_404(item_id)
    db.session.delete(item)
    commit_session()
    return jsonify({"success": True})


@app.route("/admin/update_status/<int:order_id>", methods=["POST"])
@admin_required
def legacy_update_order_status(order_id: int):
    order = Order.query.get_or_404(order_id)
    payload = request.get_json(silent=True) or {}
    order.status = payload.get("status") or order.status
    commit_session()
    return jsonify({"success": True})


@app.route("/admin/delete_order/<int:order_id>", methods=["POST"])
@admin_required
def legacy_delete_order(order_id: int):
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    commit_session()
    return jsonify({"success": True})


@app.route("/admin/delete_category", methods=["POST"])
@admin_required
def delete_category():
    payload = request.get_json(silent=True) or {}
    category = payload.get("category")
    if not category:
        return jsonify({"success": False, "message": "Категория не указана."}), 400

    MenuItem.query.filter_by(category=category).update({"category": "Без категории"})
    commit_session()
    return jsonify({"success": True})


@app.route("/admin/update_category_order", methods=["POST"])
@admin_required
def update_category_order():
    return jsonify({"success": True, "message": "Порядок категорий управляется автоматически."})


@app.route("/admin/update_item_order", methods=["POST"])
@admin_required
def update_item_order():
    payload = request.get_json(silent=True) or {}
    item = MenuItem.query.get_or_404(to_int(payload.get("item_id")))
    if payload.get("category"):
        item.category = payload["category"]
    if payload.get("position") is not None:
        item.sort_order = to_int(payload.get("position"), item.sort_order)
    commit_session()
    return jsonify({"success": True})


@app.route("/admin/check_new_orders")
@admin_required
def check_new_orders():
    last_id = to_int(request.args.get("last_id"), 0)
    orders = Order.query.filter(Order.id > last_id).order_by(Order.id.desc()).all()
    return jsonify(
        {
            "new_orders": bool(orders),
            "orders": [serialize_order(order) for order in orders],
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
