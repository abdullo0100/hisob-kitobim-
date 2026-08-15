import asyncio
import sys
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

from config import TELEGRAM_BOT_TOKEN, WEBAPP_URL

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # Telegram Mini App button
    keyboard = [
        [InlineKeyboardButton("Ilovani ochish", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Salom! Hisob-kitoblarni boshqarish uchun quyidagi tugmani bosing:",
        reply_markup=reply_markup
    )

def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN topilmadi!")
        sys.exit(1)

    print("Bot ishga tushmoqda...")
    
    # PTB v21.6 + Python 3.14 compatibility: if running in Windows, use ProactorEventLoop or let asyncio run normally.
    # We create application with specific timeouts
    application = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .connect_timeout(30.0)
        .read_timeout(30.0)
        .write_timeout(30.0)
        .pool_timeout(30.0)
        .build()
    )

    application.add_handler(CommandHandler("start", start))

    print("Bot tayyor! /start buyrug'ini yuboring.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    # Python 3.14 event loop fix
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())
    main()
