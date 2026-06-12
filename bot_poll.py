"""Bot runner via long polling (getUpdates).

Used on the SERVER (started in the background from entrypoint.sh) because
Cloudflare blocks inbound Telegram webhook requests (403). Polling is outbound,
so it bypasses Cloudflare. Also usable locally instead of the web server.

Reuses the exact same handlers as the webhook (run_bot_polling -> process_
telegram_update in app.py). run_bot_polling deletes any webhook and skips the
backlog, so it only reacts to messages sent after it starts.

Stop: Ctrl+C
"""

from __future__ import annotations

import time

from app import BOT_TOKEN, run_bot_polling

if __name__ == "__main__":
    if not BOT_TOKEN:
        print("No TELEGRAM_BOT_TOKEN — bot polling disabled.")
    else:
        # Restart if run_bot_polling ever returns (e.g. a transient network error
        # during the initial deleteWebhook/getUpdates handshake).
        while True:
            run_bot_polling()
            time.sleep(5)
