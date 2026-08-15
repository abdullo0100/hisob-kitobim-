import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot Token — @BotFather dan olinadi
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Google Sheets ID — spreadsheet URL-dan olinadi
# Masalan: https://docs.google.com/spreadsheets/d/XXXXXXX/edit → XXXXXXX
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID") or "1eZDifvGhwNwXxluM7TZF45ktNbz46vJpycfnnwIDaiA"

# Google credentials fayl yo'li
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")

# Sheets varaq nomi
SHEET_NAME = "Hisoblar"

# Qo'llab-quvvatlanadigan kategoriyalar (foydalanuvchi boshqa kategoriya ham yozishi mumkin)
DEFAULT_CATEGORIES = [
    "ovqat",
    "transport",
    "kiyim",
    "uy",
    "kommunal",
    "telefon",
    "internet",
    "maosh",
    "daromad",
    "qarz",
    "tibbiyot",
    "ta'lim",
    "ko'ngilochar",
    "boshqa",
]

# Turi — kirim yoki chiqim
INCOME_KEYWORDS = ["kirim", "daromad", "oldi", "+"]
EXPENSE_KEYWORDS = ["chiqim", "xarajat", "berdi", "to'lov", "-"]

# Sana formati
DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M"

# Vaqt zonasi (O'zbekiston)
TIMEZONE = "Asia/Tashkent"

# Web App URL
WEBAPP_URL = os.getenv('WEBAPP_URL', 'http://localhost:5000')
