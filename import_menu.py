"""Replace the menu_items in the app database with menu_source.json.

Idempotent: wipes the menu_items table and reinserts the snapshot, so it can be
run repeatedly and on any backend (local SQLite or Render Postgres via DATABASE_URL).

Usage:
    python import_menu.py
"""

from __future__ import annotations

import json
from pathlib import Path

from app import app
from models import MenuItem, db

SOURCE = Path("menu_source.json")


def main() -> None:
    items = json.loads(SOURCE.read_text(encoding="utf-8"))
    with app.app_context():
        deleted = MenuItem.query.delete()
        for data in items:
            db.session.add(
                MenuItem(
                    name=data["name"],
                    description=data.get("description"),
                    price=float(data.get("price") or 0),
                    category=data["category"],
                    image_url=data.get("image_url"),
                    is_food=bool(data.get("is_food", True)),
                    visible=True,
                    sort_order=int(data.get("sort_order") or 0),
                    details=data.get("details") or {},
                )
            )
        db.session.commit()

        total = MenuItem.query.count()
        with_image = MenuItem.query.filter(
            MenuItem.image_url.isnot(None), MenuItem.image_url != ""
        ).count()
    print(f"removed {deleted} old items, inserted {len(items)}")
    print(f"menu_items now: {total}  with_image: {with_image}")


if __name__ == "__main__":
    main()
