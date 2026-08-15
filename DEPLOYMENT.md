# 🚀 Loyihani GitHub va Vercel / Render-ga Joylash (24/7 Bepul Hosting)

Ushbu yo'riqnoma orqali loyihangizni GitHub-ga yuklab, **Vercel** yoki **Render** bepul bulutli serverlariga joylaysiz.
Shunda Mini App tunnel-larsiz, **24/7 uzluksiz** va **to'g'ridan-to'g me'yorda** ishlaydi!

---

## 1-Bosqich: Loyihani GitHub-ga Yuklash

1. [GitHub.com](https://github.com) saytiga kiring va yangi repository yarating (masalan: `telegram-sheets-bot`).
2. Loyiha papkangizdagi barcha fayllarni GitHub-ga yuklang (`credentials.json` va `.env` yuklanmaydi — ular xavfsizlik uchun `.gitignore` qilindi).

---

## 2-Bosqich: Vercel-ga Bepul Deploy Qilish (Tavsiya etiladi - 1 daqiqa)

1. [Vercel.com](https://vercel.com) saytiga GitHub akkauntingiz orqali kiring.
2. **"Add New..."** → **"Project"** tugmasini bosing.
3. GitHub-dagi `telegram-sheets-bot` repository-ingizni tanlang va **Import** ni bosing.
4. **Environment Variables** bo'limiga quyidagilarni qo'shing:

   | Key | Value |
   |-----|-------|
   | `GOOGLE_SHEET_ID` | `1eZDifvGhwNwXxluM7TZF45ktNbz46vJpycfnnwIDaiA` |
   | `TELEGRAM_BOT_TOKEN` | `8625426375:AAF67DtnnJQxKtLf1M_jmHYzJ5Njz--Hbvo` |
   | `GOOGLE_CREDENTIALS_JSON` | `credentials.json` faylingizning ichidagi barcha matn (JSON string) |

5. **Deploy** tugmasini bosing!
6. Vercel sizga doimiy HTTPS manzil beradi (masalan: `https://telegram-sheets-bot.vercel.app`).

---

## 3-Bosqich: Bot-dagi Mini App URL-ni Yangilash

1. Vercel bergan HTTPS manzilni `.env` faylingizdagi `WEBAPP_URL` joyiga yozing:
   ```env
   WEBAPP_URL=https://telegram-sheets-bot.vercel.app
   ```
2. Telegram-da botingizga **`/start`** yuboring — Mini App bir umrga 24/7 uzluksiz ishlaydi! 🎉
