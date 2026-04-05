from __future__ import annotations

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    phone = db.Column(db.String(64), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)

    orders = db.relationship("Order", back_populates="user", lazy=True)


class Label(TimestampMixin, db.Model):
    __tablename__ = "labels"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(120), nullable=False, unique=True, index=True)
    emoji = db.Column(db.String(16), nullable=True)
    color = db.Column(db.String(32), nullable=False, default="#D4AF37")
    visible = db.Column(db.Boolean, nullable=False, default=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    payload = db.Column(db.JSON, nullable=False, default=dict)

    menu_items = db.relationship("MenuItem", back_populates="label", lazy=True)


class MenuItem(TimestampMixin, db.Model):
    __tablename__ = "menu_items"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False, default=0.0)
    category = db.Column(db.String(255), nullable=False)
    image_url = db.Column(db.String(2048), nullable=True)
    is_food = db.Column(db.Boolean, nullable=False, default=True)
    visible = db.Column(db.Boolean, nullable=False, default=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    details = db.Column(db.JSON, nullable=False, default=dict)

    label_id = db.Column(db.Integer, db.ForeignKey("labels.id"), nullable=True, index=True)
    label = db.relationship("Label", back_populates="menu_items", lazy=True)


class Advertisement(TimestampMixin, db.Model):
    __tablename__ = "advertisements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(2048), nullable=True)
    cta_text = db.Column(db.String(120), nullable=True)
    cta_url = db.Column(db.String(2048), nullable=True)
    visible = db.Column(db.Boolean, nullable=False, default=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    payload = db.Column(db.JSON, nullable=False, default=dict)


class PageContent(TimestampMixin, db.Model):
    __tablename__ = "page_content"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(120), nullable=False, unique=True, index=True)
    title = db.Column(db.String(255), nullable=True)
    subtitle = db.Column(db.Text, nullable=True)
    visible = db.Column(db.Boolean, nullable=False, default=True)
    payload = db.Column(db.JSON, nullable=False, default=dict)


class Order(TimestampMixin, db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    customer_name = db.Column(db.String(255), nullable=False)
    customer_phone = db.Column(db.String(64), nullable=False)
    customer_address = db.Column(db.Text, nullable=False)
    order_details = db.Column(db.JSON, nullable=False, default=list)
    total_price = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(64), nullable=False, default="Новый")

    user = db.relationship("User", back_populates="orders", lazy=True)


class BotAdmin(TimestampMixin, db.Model):
    __tablename__ = "bot_admins"

    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.String(64), nullable=False, unique=True, index=True)
    name = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

