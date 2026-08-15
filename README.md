# 🤖 Telegram Hisobchi Bot

Telegram orqali kirim va chiqimlaringizni yozib boring — hammasi avtomatik **Google Sheets**-ga tushadi!

---

## 📸 Qanday ishlaydi?

1. Telegramda botga yozasiz: `chiqim 50000 ovqat tushlik uchun`
2. Bot yozuvni Google Sheets-ga saqlaydi
3. Balans, statistika — hammasi bot orqali

---

## 🚀 O'rnatish

### 1-qadam: Telegram Bot yaratish

1. Telegram-da [@BotFather](https://t.me/BotFather) ga o'ting
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: `Mening Hisobchim`)
4. Bot username kiriting (masalan: `mening_hisobchi_bot`)
5. BotFather sizga **Token** beradi — uni saqlang!

   ```
   Masalan: 7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2-qadam: Google Cloud Console sozlash

1. [Google Cloud Console](https://console.cloud.google.com/) ga o'ting
2. **Yangi loyiha** yarating (yoki mavjudini tanlang)
3. **API & Services** → **Library** bo'limiga o'ting
4. Quyidagi API-larni yoqing:
   - **Google Sheets API** — qidiring va "Enable" tugmasini bosing
   - **Google Drive API** — qidiring va "Enable" tugmasini bosing
5. **API & Services** → **Credentials** bo'limiga o'ting
6. **Create Credentials** → **Service Account** ni tanlang
7. Nom bering (masalan: `telegram-bot`) va yarating
8. Yaratilgan Service Account-ga kiring → **Keys** tab → **Add Key** → **Create New Key** → **JSON**
9. Yuklab olingan faylni `credentials.json` deb nomlang va loyiha papkasiga qo'ying

### 3-qadam: Google Sheets yaratish

1. [Google Sheets](https://sheets.google.com/) da yangi spreadsheet yarating
2. Spreadsheet URL-dan **ID**-ni ko'chiring:
   ```
   https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/edit
                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                          Bu — sizning Sheet ID
   ```
3. Spreadsheet-da **Share** tugmasini bosing
4. `credentials.json` faylini oching va `client_email` maydonini toping:
   ```json
   "client_email": "telegram-bot@your-project.iam.gserviceaccount.com"
   ```
5. Shu email manzilni **Editor** sifatida qo'shing

### 4-qadam: Loyihani sozlash

1. Python 3.10+ o'rnatilganligini tekshiring:
   ```bash
   python --version
   ```

2. Kutubxonalarni o'rnating:
   ```bash
   pip install -r requirements.txt
   ```

3. `.env` faylni yarating:
   ```bash
   copy .env.example .env
   ```

4. `.env` faylni oching va qiymatlarni kiriting:
   ```env
   TELEGRAM_BOT_TOKEN=7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   GOOGLE_SHEET_ID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   GOOGLE_CREDENTIALS_FILE=credentials.json
   ```

### 5-qadam: Botni ishga tushirish

```bash
python bot.py
```

Muvaffaqiyatli ishga tushganda:
```
🤖 Bot ishga tushmoqda...
✅ Bot tayyor! Ctrl+C bilan to'xtatish mumkin.
```

---

## 📝 Foydalanish

### Xabar formati

```
[turi] [summa] [kategoriya] [izoh]
```

| Qism | Tavsif | Misol |
|------|--------|-------|
| **Turi** | `kirim`, `chiqim`, `+`, `-`, `daromad`, `xarajat`, `to'lov` | `chiqim` |
| **Summa** | Faqat raqam | `50000` |
| **Kategoriya** | Istalgan so'z | `ovqat` |
| **Izoh** | Ixtiyoriy, qo'shimcha ma'lumot | `tushlik uchun` |

### Misollar

```
chiqim 50000 ovqat tushlik uchun
kirim 1000000 maosh
- 30000 transport taksi
+ 500000 sovg'a tug'ilgan kun
chiqim 150000 kiyim ko'ylak
```

### Buyruqlar

| Buyruq | Vazifasi |
|--------|----------|
| `/start` | 👋 Botni ishga tushirish |
| `/help` | 📖 Yordam — format ko'rsatmasi |
| `/balans` | 💰 Joriy balansni ko'rsatish |
| `/bugun` | 📅 Bugungi barcha yozuvlar |
| `/oylik` | 📊 Joriy oy statistikasi (kategoriya bo'yicha) |
| `/bekor` | ❌ Oxirgi yozuvni o'chirish |

---

## 📊 Google Sheets tuzilishi

Bot avtomatik **"Hisoblar"** nomli varaq yaratadi:

| Sana | Vaqt | Turi | Summa | Kategoriya | Izoh | Balans |
|------|------|------|-------|------------|------|--------|
| 2026-08-14 | 15:30 | chiqim | 50000 | ovqat | tushlik uchun | -50000 |
| 2026-08-14 | 18:00 | kirim | 1000000 | maosh | | 950000 |

---

## 🔧 Muammolarni hal qilish

### "TELEGRAM_BOT_TOKEN topilmadi"
→ `.env` faylni yaratganingizni va tokenni to'g'ri yozganingizni tekshiring.

### "credentials.json topilmadi"
→ Google Cloud Console-dan yuklab olgan JSON faylni `credentials.json` deb nomlang va loyiha papkasiga qo'ying.

### "Permission denied" yoki Sheets-ga yoza olmayapti
→ Google Sheets-da Service Account email-ni **Editor** sifatida share qilganingizni tekshiring.

### "WorksheetNotFound" xatosi
→ Bot birinchi ishga tushganda "Hisoblar" varag'ini avtomatik yaratadi. Agar muammo bo'lsa, spreadsheet-ni qayta tekshiring.

---

## 📁 Loyiha tuzilishi

```
telegram-sheets-bot/
├── bot.py              # Asosiy bot kodi
├── sheets.py           # Google Sheets bilan ishlash
├── config.py           # Sozlamalar
├── requirements.txt    # Python kutubxonalar
├── .env                # Muhit o'zgaruvchilari (siz yaratishingiz kerak)
├── .env.example        # Namuna
├── credentials.json    # Google Service Account kaliti (siz qo'shishingiz kerak)
└── README.md           # Ushbu hujjat
```

---

## 📄 Litsenziya

Bu loyiha erkin foydalanish uchun.
