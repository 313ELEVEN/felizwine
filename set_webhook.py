"""Register the Telegram webhook for the order bot.

Run after deploy (locally needs a public tunnel). Reads from env:
    TELEGRAM_BOT_TOKEN       - bot token (required)
    WEBHOOK_URL              - public webhook URL
                               (default https://felizwinebar.md/telegram/webhook)
    TELEGRAM_WEBHOOK_SECRET  - shared secret, must match the app env (optional)

Usage:
    TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... python set_webhook.py
    python set_webhook.py delete    # remove the webhook
"""

import os
import sys

import requests

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
# Use the DIRECT Render URL, not felizwinebar.md — Cloudflare blocks Telegram's
# webhook delivery (403) on the custom domain.
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "https://felizwine.onrender.com/telegram/webhook").strip()
SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "").strip()


def main() -> None:
    if not TOKEN:
        raise SystemExit("Set TELEGRAM_BOT_TOKEN first.")

    if len(sys.argv) > 1 and sys.argv[1] == "delete":
        resp = requests.post(f"https://api.telegram.org/bot{TOKEN}/deleteWebhook", timeout=15)
        print(resp.json())
        return

    payload = {
        "url": WEBHOOK_URL,
        "allowed_updates": ["message", "callback_query"],
    }
    if SECRET:
        payload["secret_token"] = SECRET
    resp = requests.post(f"https://api.telegram.org/bot{TOKEN}/setWebhook", json=payload, timeout=15)
    print("setWebhook:", resp.json())

    commands = [
        {"command": "livrare", "description": "Comenzi livrare (24h)"},
        {"command": "feliz", "description": "Comenzi in Feliz / la masă (24h)"},
        {"command": "free", "description": "Toate comenzile (24h)"},
        {"command": "profile", "description": "Profilul meu / statistică"},
        {"command": "name", "description": "Setează numele tău (ex: /name Ion)"},
    ]
    resp = requests.post(
        f"https://api.telegram.org/bot{TOKEN}/setMyCommands",
        json={"commands": commands},
        timeout=15,
    )
    print("setMyCommands:", resp.json())


if __name__ == "__main__":
    main()
