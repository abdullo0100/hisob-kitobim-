import os
import sys

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import TELEGRAM_BOT_TOKEN

app = Flask(__name__)
CORS(app)

# Vercel WSGI Middleware: Normalizes PATH_INFO when Vercel rewrites to /api/index.py
class VercelMiddleware:
    def __init__(self, app):
        self.app = app
    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')
        if path.startswith('/api/index.py'):
            new_path = path[len('/api/index.py'):]
            if not new_path:
                new_path = '/'
            environ['PATH_INFO'] = new_path
        return self.app(environ, start_response)

app.wsgi_app = VercelMiddleware(app.wsgi_app)

sheets_manager = None

def get_sm():
    global sheets_manager
    if sheets_manager is None:
        from sheets import SheetsManager
        sheets_manager = SheetsManager()
    return sheets_manager

HTML_PAGE = """<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Hisobotlar & Sverka</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        :root {
            --bg-color: #0f172a;
            --glass-bg: rgba(30, 41, 59, 0.7);
            --glass-border: rgba(255, 255, 255, 0.1);
            --primary: #3b82f6;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background-color: var(--bg-color); color: var(--text-main); min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); }
        .header { padding: 16px; text-align: center; background: var(--glass-bg); backdrop-filter: blur(10px); border-bottom: 1px solid var(--glass-border); position: sticky; top: 0; z-index: 10; }
        .header h1 { font-size: 20px; font-weight: 700; }
        .balance-card { margin: 16px; padding: 20px; border-radius: 18px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%); border: 1px solid rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); text-align: center; }
        .balance-card h2 { font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .balance-card .amount { font-size: 32px; font-weight: 700; color: #fff; }
        .step-container { flex: 1; padding: 16px; position: relative; }
        .step { display: none; }
        .step.active { display: block; }
        .glass-panel { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px; padding: 20px; backdrop-filter: blur(10px); margin-bottom: 16px; }
        h3 { margin-bottom: 16px; font-size: 18px; color: #fff; }
        .btn { display: block; width: 100%; padding: 14px; border-radius: 12px; border: none; font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 12px; cursor: pointer; background: rgba(255, 255, 255, 0.1); border: 1px solid var(--glass-border); text-align: center; }
        .btn-primary { background: linear-gradient(to right, #3b82f6, #8b5cf6); }
        .btn-success { background: linear-gradient(to right, #10b981, #059669); }
        .btn-danger { background: linear-gradient(to right, #ef4444, #dc2626); }
        .btn-warning { background: linear-gradient(to right, #f59e0b, #d97706); }
        .input-group { margin-bottom: 16px; }
        .input-group label { display: block; margin-bottom: 6px; color: var(--text-muted); font-size: 13px; }
        .input-group input { width: 100%; padding: 12px; border-radius: 10px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--glass-border); color: #fff; font-size: 15px; outline: none; }
        .client-list { max-height: 250px; overflow-y: auto; margin-bottom: 15px; }
        .client-item { padding: 14px; border-bottom: 1px solid var(--glass-border); cursor: pointer; display: flex; justify-content: space-between; }
        .sverka-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .summary-box { background: rgba(0, 0, 0, 0.25); border: 1px solid var(--glass-border); padding: 12px; border-radius: 10px; text-align: center; }
        .summary-box .title { font-size: 11px; color: var(--text-muted); }
        .summary-box .val { font-size: 14px; font-weight: 700; margin-top: 4px; }
        .tx-list { max-height: 250px; overflow-y: auto; margin-bottom: 16px; }
        .tx-item { padding: 10px; border-bottom: 1px solid var(--glass-border); font-size: 13px; }
        .tx-item .top-row { display: flex; justify-content: space-between; font-weight: 600; }
        .tx-item .bot-row { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 11px; margin-top: 4px; }
    </style>
</head>
<body>

    <div class="header">
        <h1>📊 Hisob-kitob & Sverka</h1>
    </div>

    <div class="balance-card">
        <h2>Umumiy Balans</h2>
        <div class="amount" id="balanceDisplay">0 UZS</div>
    </div>

    <div class="step-container">
        <!-- Step 1: Main Menu -->
        <div class="step active" id="step-main">
            <div class="glass-panel">
                <button class="btn btn-success" onclick="startFlow('kirim')">🟢 Kirim Qo'shish (+)</button>
                <button class="btn btn-danger" onclick="startFlow('chiqim')">🔴 Chiqim Qo'shish (-)</button>
                <button class="btn btn-warning" onclick="startFlow('sverka')">📋 Mijoz bilan Sverka (Hisobot)</button>
            </div>
        </div>

        <!-- Step 2: Select Client -->
        <div class="step" id="step-client">
            <div class="glass-panel">
                <h3 id="clientTitle">Mijozni tanlang</h3>
                <div class="client-list" id="clientList"></div>
                <div style="margin-top: 15px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                    <div class="input-group">
                        <label>👤 Yangi mijoz qo'shish</label>
                        <input type="text" id="newClientName" placeholder="Mijoz ismini kiriting">
                    </div>
                    <button class="btn btn-primary" onclick="addNewClient()">Qo'shish</button>
                </div>
                <button class="btn" style="margin-top: 5px;" onclick="goToStep('step-main')">⬅️ Ortga</button>
            </div>
        </div>

        <!-- Step 3: Kirim Form -->
        <div class="step" id="step-kirim">
            <div class="glass-panel">
                <h3>🟢 Kirim ma'lumotlari</h3>
                <div class="input-group">
                    <label>Summa (UZS)</label>
                    <input type="number" id="kirimSumma" placeholder="0">
                </div>
                <div class="input-group">
                    <label>Ushlab qolinadigan foiz % (Ixtiyoriy)</label>
                    <input type="number" step="0.01" id="kirimFoiz" placeholder="Masalan: 1.5">
                </div>
                <div class="input-group">
                    <label>Kategoriya</label>
                    <input type="text" id="kirimKategoriya" placeholder="Masalan: savdo">
                </div>
                <div class="input-group">
                    <label>Izoh</label>
                    <input type="text" id="kirimIzoh" placeholder="Izoh qoldiring">
                </div>
                <button class="btn btn-success" id="btnSaveKirim" onclick="saveKirim()">💾 Saqlash</button>
                <button class="btn" onclick="goToStep('step-client')">⬅️ Ortga</button>
            </div>
        </div>

        <!-- Step 4: Chiqim Form -->
        <div class="step" id="step-chiqim">
            <div class="glass-panel">
                <h3>🔴 Chiqim ma'lumotlari</h3>
                <div class="input-group">
                    <label>Summa (UZS)</label>
                    <input type="number" id="chiqimSumma" placeholder="0">
                </div>
                <div class="input-group">
                    <label>Kategoriya</label>
                    <input type="text" id="chiqimKategoriya" placeholder="Masalan: xarajat">
                </div>
                <div class="input-group">
                    <label>Izoh</label>
                    <input type="text" id="chiqimIzoh" placeholder="Izoh qoldiring">
                </div>
                <button class="btn btn-danger" id="btnSaveChiqim" onclick="saveChiqim()">💾 Saqlash</button>
                <button class="btn" onclick="goToStep('step-client')">⬅️ Ortga</button>
            </div>
        </div>

        <!-- Step 5: Sverka View -->
        <div class="step" id="step-sverka">
            <div class="glass-panel">
                <h3 id="sverkaClientTitle">📋 Sverka Hujjati</h3>
                <div class="sverka-summary">
                    <div class="summary-box">
                        <div class="title">Jami Kirim</div>
                        <div class="val" style="color: var(--success);" id="svJamiKirim">0</div>
                    </div>
                    <div class="summary-box">
                        <div class="title">Sof Kirim</div>
                        <div class="val" style="color: var(--primary);" id="svJamiSof">0</div>
                    </div>
                    <div class="summary-box">
                        <div class="title">Jami Chiqim</div>
                        <div class="val" style="color: var(--danger);" id="svJamiChiqim">0</div>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 12px; text-align: center; margin-bottom: 16px; background: rgba(59, 130, 246, 0.15);">
                    <div style="font-size: 12px; color: var(--text-muted);">QOLDIQ BALANS</div>
                    <div style="font-size: 24px; font-weight: 700; color: #fff;" id="svQoldiqBalans">0 UZS</div>
                </div>

                <h4>Operatsiyalar tarixi:</h4>
                <div class="tx-list" id="sverkaTxList"></div>

                <button class="btn btn-primary" id="btnSendReport" onclick="sendTelegramReport()">📤 Telegram-ga Otchot Jo'natish</button>
                <button class="btn" onclick="goToStep('step-client')">⬅️ Ortga</button>
            </div>
        </div>

        <!-- Step 6: Edit Kirim Form -->
        <div class="step" id="step-edit-kirim">
            <div class="glass-panel">
                <h3>✏️ Kirimni Tahrirlash</h3>
                <input type="hidden" id="editKirimId">
                <div class="input-group">
                    <label>Summa (UZS)</label>
                    <input type="number" id="editKirimSumma" placeholder="0">
                </div>
                <div class="input-group">
                    <label>Ushlab qolinadigan foiz %</label>
                    <input type="number" step="0.01" id="editKirimFoiz" placeholder="0">
                </div>
                <div class="input-group">
                    <label>Kategoriya</label>
                    <input type="text" id="editKirimKategoriya" placeholder="Kategoriya">
                </div>
                <div class="input-group">
                    <label>Izoh</label>
                    <input type="text" id="editKirimIzoh" placeholder="Izoh">
                </div>
                <button class="btn btn-warning" id="btnSaveEditKirim" onclick="saveEditKirim()">💾 O'zgarishlarni Saqlash</button>
                <button class="btn" onclick="goToStep('step-sverka')">⬅️ Ortga</button>
            </div>
        </div>
    </div>

    <script>
        const tg = window.Telegram ? window.Telegram.WebApp : null;
        if(tg) tg.expand();
        let currentFlow = '', selectedClientId = null, selectedClientName = '';
        function formatMoney(n) { return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS'; }
        async function fetchBalance() {
            try {
                const res = await fetch('/api/balance');
                const data = await res.json();
                if(data.success) document.getElementById('balanceDisplay').innerText = formatMoney(data.balance);
            } catch(e) {}
        }
        function goToStep(id) {
            document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        }
        function startFlow(type) { currentFlow = type; loadClients(); goToStep('step-client'); }
        async function loadClients() {
            const list = document.getElementById('clientList');
            list.innerHTML = 'Yuklanmoqda...';
            try {
                const res = await fetch('/api/clients');
                const data = await res.json();
                list.innerHTML = '';
                if(data.success && data.clients) {
                    data.clients.forEach(c => {
                        const div = document.createElement('div');
                        div.className = 'client-item';
                        div.innerHTML = `<span>👤 <strong>${c.ism}</strong></span> <span>➡️</span>`;
                        div.onclick = () => selectClient(c.id, c.ism);
                        list.appendChild(div);
                    });
                }
            } catch(e) { list.innerHTML = 'Xatolik!'; }
        }
        async function addNewClient() {
            const input = document.getElementById('newClientName');
            const name = input.value.trim();
            if(!name) return;
            const res = await fetch('/api/clients', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ism: name}) });
            const data = await res.json();
            if(data.success) { input.value = ''; selectClient(data.client.id, data.client.ism); }
        }
        function selectClient(id, name) {
            selectedClientId = id; selectedClientName = name;
            if(currentFlow === 'kirim') goToStep('step-kirim');
            else if(currentFlow === 'chiqim') goToStep('step-chiqim');
            else if(currentFlow === 'sverka') loadSverka(id);
        }
        async function loadSverka(id) {
            const list = document.getElementById('sverkaTxList');
            list.innerHTML = 'Yuklanmoqda...';
            goToStep('step-sverka');
            try {
                const res = await fetch('/api/sverka/' + id);
                const data = await res.json();
                if(data.success && data.sverka) {
                    const sv = data.sverka;
                    document.getElementById('sverkaClientTitle').innerText = '📋 Sverka: ' + sv.klient_name;
                    document.getElementById('svJamiKirim').innerText = formatMoney(sv.jami_kirim);
                    document.getElementById('svJamiSof').innerText = formatMoney(sv.jami_sof_kirim);
                    document.getElementById('svJamiChiqim').innerText = formatMoney(sv.jami_chiqim);
                    document.getElementById('svQoldiqBalans').innerText = formatMoney(sv.qoldiq_balans);
                    list.innerHTML = sv.yozuvlar.slice().reverse().map(y => `
                        <div class="tx-item">
                            <div class="top-row">
                                <span style="color: ${y.turi === 'kirim' ? 'var(--success)' : 'var(--danger)'}">${y.turi === 'kirim' ? '🟢 Kirim' : '🔴 Chiqim'}</span>
                                <span>${formatMoney(y.summa)} ${y.turi === 'kirim' ? `<button onclick="openEditKirim(${y.id}, ${y.summa}, ${y.foiz || 0}, '${(y.kategoriya||'').replace(/'/g, "\\'")}', '${(y.izoh||'').replace(/'/g, "\\'")}')" style="background:none;border:none;color:var(--warning);cursor:pointer;">✏️</button>` : ''}</span>
                            </div>
                            <div class="bot-row"><span>${y.sana} ${y.vaqt}</span><span>${y.kategoriya||''}</span></div>
                        </div>
                    `).join('');
                }
            } catch(e) { list.innerHTML = 'Xatolik!'; }
        }
        function openEditKirim(id, summa, foiz, kat, izoh) {
            document.getElementById('editKirimId').value = id;
            document.getElementById('editKirimSumma').value = summa;
            document.getElementById('editKirimFoiz').value = foiz;
            document.getElementById('editKirimKategoriya').value = kat;
            document.getElementById('editKirimIzoh').value = izoh;
            goToStep('step-edit-kirim');
        }
        async function saveEditKirim() {
            const id = document.getElementById('editKirimId').value;
            const summa = document.getElementById('editKirimSumma').value;
            const foiz = document.getElementById('editKirimFoiz').value;
            const kat = document.getElementById('editKirimKategoriya').value;
            const izoh = document.getElementById('editKirimIzoh').value;
            if(!id || !summa) return;
            const res = await fetch('/api/kirim/edit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: parseInt(id), summa: parseFloat(summa), foiz: parseFloat(foiz||0), kategoriya: kat, izoh: izoh}) });
            const data = await res.json();
            if(data.success) { fetchBalance(); loadSverka(selectedClientId); }
        }
        async function sendTelegramReport() {
            const chatId = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
            if(!chatId) { alert("Telegram orqali kiring"); return; }
            const res = await fetch('/api/send-report', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({klient_id: selectedClientId, chat_id: chatId}) });
            const data = await res.json();
            if(data.success && tg) tg.showAlert("✅ Hisobot Telegram-ga jo'natildi!");
        }
        async function saveKirim() {
            const summa = document.getElementById('kirimSumma').value;
            const foiz = document.getElementById('kirimFoiz').value;
            const kat = document.getElementById('kirimKategoriya').value;
            const izoh = document.getElementById('kirimIzoh').value;
            if(!summa) return;
            const res = await fetch('/api/kirim', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({klient_id: selectedClientId, summa: parseFloat(summa), foiz: parseFloat(foiz||0), kategoriya: kat, izoh: izoh}) });
            const data = await res.json();
            if(data.success) { fetchBalance(); goToStep('step-main'); }
        }
        async function saveChiqim() {
            const summa = document.getElementById('chiqimSumma').value;
            const kat = document.getElementById('chiqimKategoriya').value;
            const izoh = document.getElementById('chiqimIzoh').value;
            if(!summa) return;
            const res = await fetch('/api/chiqim', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({klient_id: selectedClientId, summa: parseFloat(summa), kategoriya: kat, izoh: izoh}) });
            const data = await res.json();
            if(data.success) { fetchBalance(); goToStep('step-main'); }
        }
        fetchBalance();
        if(tg) tg.ready();
    </script>
</body>
</html>"""

@app.route('/')
def root_route():
    return HTML_PAGE

@app.route('/index.html')
def index_html():
    return HTML_PAGE

# Telegram Webhook endpoint - 24/7 cloud bot response
@app.route('/api/webhook', methods=['POST'])
def telegram_webhook():
    try:
        update = request.get_json() or {}
        if 'message' in update:
            chat_id = update['message']['chat']['id']
            text = update['message'].get('text', '')
            if text.startswith('/start'):
                import urllib.request
                import json
                
                url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": chat_id,
                    "text": "👋 *Assalomu alaykum!*\n\nHisob-kitob va Sverka tizimiga xush kelibsiz.\nQuyidagi tugmani bosib Mini App-ni oching:",
                    "parse_mode": "Markdown",
                    "reply_markup": {
                        "inline_keyboard": [
                            [
                                {
                                    "text": "🚀 Mini App-ni Ochish",
                                    "web_app": {"url": "https://hisob-kitobim.vercel.app"}
                                }
                            ]
                        ]
                    }
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req):
                    pass
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

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
            f"🔴 *Chiqim:* `{fmt(sv['jami_chiqim'])}` so'm\n"
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
        with urllib.request.urlopen(req):
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
