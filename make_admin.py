import sys

from app import app
from models import User, db


def make_user_admin(email: str | None) -> None:
    if not email:
        print("Ошибка: укажите email пользователя.")
        print("Пример: python make_admin.py admin@example.com")
        return

    with app.app_context():
        user = User.query.filter_by(email=email.strip().lower()).first()
        if not user:
            print(f"Пользователь с email '{email}' не найден.")
            return

        user.is_admin = True
        db.session.commit()
        print(f"Пользователь '{email}' назначен администратором.")


if __name__ == "__main__":
    make_user_admin(sys.argv[1] if len(sys.argv) > 1 else None)
