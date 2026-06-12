"""Standalone local bot runner via long polling (getUpdates).

Normally you don't need this: `python3 app.py` already runs the bot in a
background thread when BOT_POLLING=1 (set in local_config.env). Use this script
only if you want to run the bot WITHOUT the web server.

Run:  python3 bot_poll.py
Stop: Ctrl+C

⚠️ Do NOT run polling once a production webhook is live — it deletes the webhook,
which would stop the deployed bot. Render uses the webhook (set_webhook.py).
"""

from app import run_bot_polling

if __name__ == "__main__":
    run_bot_polling()
