import os
import sys

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
from sheets import SheetsManager

app = Flask(__name__)
CORS(app)

sheets_manager = None

def get_sm():
    global sheets_manager
    if sheets_manager is None:
        sheets_manager = SheetsManager()
    return sheets_manager

@app.route('/api/clients', methods=['GET'])
def get_clients():
    try:
        sm = get_sm()
        clients = sm.get_clients()
        return jsonify({"success": True, "clients": clients})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/clients', methods=['POST'])
def add_client():
    try:
        data = request.json or {}
        ism = data.get('ism')
        if not ism:
            return jsonify({"success": False, "error": "ism is required"}), 400
        sm = get_sm()
        client = sm.add_client(ism)
        return jsonify({"success": True, "client": client})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/kirim', methods=['POST'])
def add_kirim():
    try:
        data = request.json or {}
        klient_id = data.get('klient_id')
        summa = data.get('summa')
        foiz = data.get('foiz', 0)
        kategoriya = data.get('kategoriya', '')
        izoh = data.get('izoh', '')
        if not klient_id or not summa:
            return jsonify({"success": False, "error": "klient_id and summa are required"}), 400
        sm = get_sm()
        result = sm.append_kirim(klient_id, summa, foiz, kategoriya, izoh)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/kirim/edit', methods=['POST'])
def edit_kirim():
    try:
        data = request.json or {}
        record_id = data.get('id')
        summa = data.get('summa')
        foiz = data.get('foiz', 0)
        kategoriya = data.get('kategoriya', '')
        izoh = data.get('izoh', '')
        if not record_id or not summa:
            return jsonify({"success": False, "error": "id and summa are required"}), 400
        sm = get_sm()
        result = sm.update_kirim(record_id, summa, foiz, kategoriya, izoh)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/chiqim', methods=['POST'])
def add_chiqim():
    try:
        data = request.json or {}
        klient_id = data.get('klient_id')
        summa = data.get('summa')
        kategoriya = data.get('kategoriya', '')
        izoh = data.get('izoh', '')
        if not klient_id or not summa:
            return jsonify({"success": False, "error": "klient_id and summa are required"}), 400
        sm = get_sm()
        result = sm.append_chiqim(klient_id, summa, kategoriya, izoh)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/sverka/<int:klient_id>', methods=['GET'])
def get_sverka(klient_id):
    try:
        sm = get_sm()
        sverka = sm.get_sverka(klient_id)
        return jsonify({"success": True, "sverka": sverka})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/send-report', methods=['POST'])
def send_report():
    try:
        import urllib.request
        import json
        from config import TELEGRAM_BOT_TOKEN
        data = request.json or {}
        klient_id = data.get('klient_id')
        chat_id = data.get('chat_id')
        if not klient_id or not chat_id:
            return jsonify({"success": False, "error": "klient_id and chat_id are required"}), 400
        sm = get_sm()
        sv = sm.get_sverka(klient_id)
        def fmt(n):
            return f"{n:,}".replace(",", " ")
        msg = (
            f"📋 *SVERKA HISOBOTI: {sv['klient_name']}*\n\n"
            f"🟢 *Jami Kirim:* `{fmt(sv['jami_kirim'])}` so'm\n"
            f"💵 *Sof Kirim:* `{fmt(sv['jami_sof_kirim'])}` so'm\n"
            f"🔴 *Jami Chiqim:* `{fmt(sv['jami_chiqim'])}` so'm\n"
            f"----------------------------------------\n"
            f"💰 *QOLDIQ BALANS:* `{fmt(sv['qoldiq_balans'])}` so'm\n\n"
            f"📝 *Operatsiyalar tarixi ({len(sv['yozuvlar'])} ta):*\n"
        )
        for y in sv['yozuvlar'][-10:]:
            turi_str = "🟢 Kirim" if y['turi'] == 'kirim' else "🔴 Chiqim"
            msg += f"• {turi_str} | `{y['sana']}` | `{fmt(y['summa'])}` so'm"
            if y['kategoriya']:
                msg += f" | {y['kategoriya']}"
            msg += "\n"
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"}
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            pass
        return jsonify({"success": True, "message": "Hisobot Telegram-ga yuborildi"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/balance', methods=['GET'])
def get_balance():
    try:
        sm = get_sm()
        balance = sm.get_balance()
        return jsonify({"success": True, "balance": balance})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
