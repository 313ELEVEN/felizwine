"""Build menu_source.json from the auronda location snapshot.

Source of truth: auronda_location.json (fetched from
https://feliz-wine-bar-ungheni.auronda.menu/api/location/<uid>).

Rules (confirmed with the owner):
- Romanian product names (auronda originalLang = ro), kept as-is.
- Drop all alcoholic groups and the hookah group.
- NEW FOOD group is distributed into natural categories by item.
- "Băuturi calde" is split by section: Cafea -> Coffee, Ceai -> Tea.
- Categories are mapped onto the app's bilingual category scheme.
"""

from __future__ import annotations

import json
from pathlib import Path

AURONDA_HOST = "https://feliz-wine-bar-ungheni.auronda.menu"
SOURCE = Path("auronda_location.json")
OUTPUT = Path("menu_source.json")

# Groups that are dropped entirely.
ALCOHOL_GROUPS = {
    "Bere",
    "Vin alb",
    "Vin rose",
    "Vin roșu",
    "Spumant",
    "Whisky",
    "Cocktailuri alcoolice",
    "Coniac Maestro",
}
DROP_GROUPS = ALCOHOL_GROUPS | {"Meniu narghilea"}
SKIP_GROUPS = {"ALERGENI"}

# auronda group name -> app bilingual category.
GROUP_TO_CATEGORY = {
    "Mic Dejun": "Завтрак / Breakfast",
    "Supe": "Супы / Soups",
    "Aperitive": "Закуски / Appetizers",
    "Salate": "Салаты / Salads",
    "Fructe de mare și pește": "Морепродукты и Рыба / Seafood and Fish",
    "Paste": "Паста / Pasta",
    "Preparate din carne": "Мясные блюда / Meat Dishes",
    "Desert": "Десерты / Desserts",
    "Băuturi răcoritoare": "Соки и Вода / Juices & Water",
    "Sucuri Santal": "Соки и Вода / Juices & Water",
    "Suc Fresh": "Соки и Вода / Juices & Water",
    "Limonade": "Безалкогольные коктейли / Non-alcoholic cocktails",
}

# "Băuturi calde" split by section name.
HOT_SECTION_TO_CATEGORY = {
    "Cafea": "Кофе / Coffee",
    "Ceai": "Чай / Tea",
}

# NEW FOOD items distributed by type (matched on stripped name).
NEW_FOOD_TO_CATEGORY = {
    "Măduva de os cu trufe și cremă de brânză": "Закуски / Appetizers",
    "Papanași pufoși cu gem": "Десерты / Desserts",
    "Carré de miel": "Десерты / Desserts",
    "Carré de vițel cu legume julien": "Мясные блюда / Meat Dishes",
    "Fusilli cu trufe și guanciale": "Паста / Pasta",
    "Creveți crocanți în tabioka": "Морепродукты и Рыба / Seafood and Fish",
    "Creveți saganaki": "Морепродукты и Рыба / Seafood and Fish",
    "Burger cu creveți cartofi și sos tartar": "Бургеры и другое / Burgers & More",
}


def resolve_category(menu_name: str, group_name: str, section_name: str, product_name: str) -> str | None:
    if group_name == "NEW FOOD✨":
        category = NEW_FOOD_TO_CATEGORY.get(product_name.strip())
        if not category:
            raise ValueError(f"Unmapped NEW FOOD item: {product_name!r}")
        return category
    if group_name == "Băuturi calde":
        category = HOT_SECTION_TO_CATEGORY.get(section_name.strip())
        if not category:
            raise ValueError(f"Unmapped hot-drink section: {section_name!r}")
        return category
    return GROUP_TO_CATEGORY.get(group_name)


def build() -> list[dict]:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    items: list[dict] = []

    for menu in data["menus"]:
        menu_name = menu.get("name", "")
        is_food = menu_name.strip() == "Meniu de mâncare"
        for group in menu.get("groups", []):
            group_name = group.get("name", "")
            if group_name in DROP_GROUPS or group_name in SKIP_GROUPS:
                continue
            for section in group.get("sections", []):
                section_name = section.get("name", "")
                for product in section.get("products", []):
                    name = (product.get("name") or "").strip()
                    if not name:
                        continue
                    category = resolve_category(menu_name, group_name, section_name, name)
                    if not category:
                        raise ValueError(f"Unmapped group: {group_name!r}")

                    price = product.get("price") or 0
                    secondary = product.get("secondary_price") or 0
                    if not price and secondary:
                        price = secondary

                    portion = (product.get("price_quantity") or "").strip()
                    description = (product.get("description") or "").strip() or portion or None

                    path_image = (product.get("path_image") or "").strip()
                    image_url = f"{AURONDA_HOST}{path_image}" if path_image else None

                    items.append(
                        {
                            "name": name,
                            "description": description,
                            "price": float(price),
                            "category": category,
                            "image_url": image_url,
                            "is_food": is_food,
                            "details": {
                                "source": "auronda",
                                "auronda_uid": product.get("uid_product"),
                                "price_quantity": portion or None,
                                "auronda_group": group_name,
                            },
                        }
                    )
    return items


def main() -> None:
    items = build()
    # sort_order: stable per category in source order.
    seen: dict[str, int] = {}
    for item in items:
        order = seen.get(item["category"], 0)
        item["sort_order"] = order
        seen[item["category"]] = order + 1

    OUTPUT.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")

    from collections import Counter

    by_cat = Counter(item["category"] for item in items)
    with_img = sum(1 for item in items if item["image_url"])
    print(f"items: {len(items)}  with_image: {with_img}  no_image: {len(items) - with_img}")
    print(f"food: {sum(1 for i in items if i['is_food'])}  drink: {sum(1 for i in items if not i['is_food'])}")
    print("by category:")
    for category, count in by_cat.items():
        print(f"  {count:3d}  {category}")
    print(f"\nwrote {OUTPUT}")


if __name__ == "__main__":
    main()
