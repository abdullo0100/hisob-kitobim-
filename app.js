// Telegram WebApp Initialization
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
    tg.expand();
    tg.ready();
    document.documentElement.style.setProperty('--bg-dark', tg.themeParams.bg_color || '#0f111a');
    document.documentElement.style.setProperty('--text-main', tg.themeParams.text_color || '#f0f0f5');
}

// State
const state = {
    currentStep: 1,
    selectedClient: null,
    clients: [],
    direction: null // 'kirim' or 'chiqim'
};

// DOM Elements
const steps = {
    1: document.getElementById('step-1'),
    2: document.getElementById('step-2'),
    '3a': document.getElementById('step-3a'),
    '3b': document.getElementById('step-3b'),
    'success': document.getElementById('step-success')
};

const backBtn = document.getElementById('back-btn');
const headerTitle = document.getElementById('header-title');
const clientList = document.getElementById('client-list');
const clientSearch = document.getElementById('client-search');

// Utility Functions
function formatMoney(amount) {
    if (!amount) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseMoney(str) {
    return parseInt(str.replace(/\s/g, '')) || 0;
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function debugLog(msg, data) {
    console.log("[AppLog]", msg, data ? data : "");
}

// Navigation
function goToStep(stepNumber, title, isBack = false) {
    const current = document.querySelector('.step.active');
    const next = steps[stepNumber];
    
    if (current && current !== next) {
        current.classList.remove('active');
        if (!isBack) {
            current.classList.add('slide-out-left');
        } else {
            current.classList.remove('slide-out-left');
        }
    }
    
    next.classList.remove('slide-out-left');
    next.classList.add('active');
    
    state.currentStep = stepNumber;
    headerTitle.textContent = title;
    
    if (stepNumber === 1 || stepNumber === 'success') {
        backBtn.classList.add('hidden');
    } else {
        backBtn.classList.remove('hidden');
    }
}

backBtn.addEventListener('click', () => {
    if (state.currentStep === 2) {
        goToStep(1, 'Klientlar', true);
    } else if (state.currentStep === '3a' || state.currentStep === '3b') {
        goToStep(2, 'Yo\'nalish', true);
    }
});

// API Calls — Flask backend
async function fetchClients() {
    try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        if (data.success) {
            return data.clients.map(c => ({ id: c.id, name: c.ism }));
        }
        return [];
    } catch (e) {
        debugLog("Fetch clients error:", e);
        return [];
    }
}

async function addClient(name) {
    try {
        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ism: name })
        });
        const data = await res.json();
        if (data.success) {
            return { id: data.client.id, name: data.client.ism };
        }
        showToast("Xatolik: " + (data.error || "Noma'lum"));
        return null;
    } catch (e) {
        debugLog("Add client error:", e);
        showToast("Tarmoq xatoligi");
        return null;
    }
}

async function saveRecord(data) {
    try {
        const endpoint = data.type === 'kirim' ? '/api/kirim' : '/api/chiqim';
        const body = {
            klient_id: data.client_id,
            summa: data.summa,
            kategoriya: data.kategoriya || '',
            izoh: data.izoh || ''
        };
        if (data.type === 'kirim') {
            body.foiz = data.foiz || 0;
        }
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        return result;
    } catch (e) {
        debugLog("Save record error:", e);
        showToast("Saqlashda xatolik");
        return { success: false };
    }
}

// Step 1: Clients
async function renderClients(filter = "") {
    if (state.clients.length === 0) {
        state.clients = await fetchClients();
    }
    
    const filtered = state.clients.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    
    if (filtered.length === 0) {
        clientList.innerHTML = '<div class="loading">Klientlar topilmadi</div>';
        return;
    }
    
    clientList.innerHTML = filtered.map(c => `
        <div class="client-card" data-id="${c.id}" data-name="${c.name}">
            <div class="client-info">
                <div class="client-icon">${c.name.charAt(0).toUpperCase()}</div>
                <div class="client-name">${c.name}</div>
            </div>
            <div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.client-card').forEach(card => {
        card.addEventListener('click', () => {
            state.selectedClient = {
                id: card.dataset.id,
                name: card.dataset.name
            };
            document.getElementById('current-client-name').textContent = state.selectedClient.name;
            goToStep(2, 'Yo\'nalish');
        });
    });
}

clientSearch.addEventListener('input', (e) => renderClients(e.target.value));

// Add Client UI
const addClientBtn = document.getElementById('show-add-client-btn');
const addClientForm = document.getElementById('add-client-form');
const cancelClientBtn = document.getElementById('cancel-client-btn');
const saveClientBtn = document.getElementById('save-client-btn');
const newClientInput = document.getElementById('new-client-name');

addClientBtn.addEventListener('click', () => {
    addClientBtn.classList.add('hidden');
    addClientForm.classList.remove('hidden');
    newClientInput.focus();
});

cancelClientBtn.addEventListener('click', () => {
    addClientBtn.classList.remove('hidden');
    addClientForm.classList.add('hidden');
    newClientInput.value = '';
});

saveClientBtn.addEventListener('click', async () => {
    const name = newClientInput.value.trim();
    if (!name) {
        showToast("Klient ismini kiriting");
        return;
    }
    saveClientBtn.disabled = true;
    const newClient = await addClient(name);
    if (!newClient) {
        saveClientBtn.disabled = false;
        return;
    }
    state.clients.push(newClient);
    await renderClients(clientSearch.value);
    
    addClientBtn.classList.remove('hidden');
    addClientForm.classList.add('hidden');
    newClientInput.value = '';
    saveClientBtn.disabled = false;
    showToast("Klient qo'shildi");
});


// Step 2: Direction
document.getElementById('btn-kirim').addEventListener('click', () => {
    state.direction = 'kirim';
    goToStep('3a', 'Kirim (Daromad)');
});

document.getElementById('btn-chiqim').addEventListener('click', () => {
    state.direction = 'chiqim';
    goToStep('3b', 'Chiqim (Xarajat)');
});

// Money Input Formatting
document.querySelectorAll('.num-input').forEach(input => {
    input.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val) {
            e.target.value = formatMoney(val);
        }
    });
});

// Step 3a: Kirim logic
const kirimSumma = document.getElementById('kirim-summa');
const kirimFoiz = document.getElementById('kirim-foiz');
const kirimFoizVal = document.getElementById('kirim-foiz-val');
const kirimUshlangan = document.getElementById('kirim-ushlangan');
const kirimSof = document.getElementById('kirim-sof');

function calculateKirim() {
    const summa = parseMoney(kirimSumma.value);
    const foiz = parseFloat(kirimFoiz.value) || 0;
    
    const ushlangan = Math.round((summa * foiz) / 100);
    const sof = summa - ushlangan;
    
    kirimUshlangan.textContent = formatMoney(ushlangan) + ' so\'m';
    kirimSof.textContent = formatMoney(sof) + ' so\'m';
}

kirimSumma.addEventListener('input', calculateKirim);
kirimFoiz.addEventListener('input', (e) => {
    kirimFoizVal.textContent = e.target.value + '%';
    calculateKirim();
});

document.getElementById('kirim-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const summa = parseMoney(kirimSumma.value);
    if (!summa) return showToast("Summani kiriting");
    
    const data = {
        client_id: state.selectedClient.id,
        client_name: state.selectedClient.name,
        type: 'kirim',
        summa: summa,
        foiz: kirimFoiz.value,
        ushlangan: parseMoney(kirimUshlangan.textContent),
        sof: parseMoney(kirimSof.textContent),
        kategoriya: document.getElementById('kirim-kategoriya').value,
        izoh: document.getElementById('kirim-izoh').value
    };
    
    const res = await saveRecord(data);
    if (res.success) showSuccess(data);
});

// Step 3b: Chiqim logic
document.getElementById('chiqim-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const summa = parseMoney(document.getElementById('chiqim-summa').value);
    if (!summa) return showToast("Summani kiriting");
    
    const data = {
        client_id: state.selectedClient.id,
        client_name: state.selectedClient.name,
        type: 'chiqim',
        summa: summa,
        kategoriya: document.getElementById('chiqim-kategoriya').value,
        izoh: document.getElementById('chiqim-izoh').value
    };
    
    const res = await saveRecord(data);
    if (res.success) showSuccess(data);
});

// Success Screen
function showSuccess(data) {
    const details = document.getElementById('success-details');
    let html = `
        <div class="detail-row"><span>Klient:</span> <strong>${data.client_name}</strong></div>
        <div class="detail-row"><span>Tur:</span> <strong>${data.type === 'kirim' ? 'Kirim' : 'Chiqim'}</strong></div>
        <div class="detail-row"><span>Summa:</span> <strong>${formatMoney(data.summa)} so'm</strong></div>
    `;
    
    if (data.type === 'kirim') {
        html += `
            <div class="detail-row"><span>Foiz:</span> <strong>${data.foiz}%</strong></div>
            <div class="detail-row"><span>Ushlangan:</span> <strong class="text-red">${formatMoney(data.ushlangan)}</strong></div>
            <div class="detail-row"><span>Sof summa:</span> <strong class="text-green">${formatMoney(data.sof)}</strong></div>
        `;
    }
    
    if (data.kategoriya) {
        html += `<div class="detail-row"><span>Kategoriya:</span> <strong>${data.kategoriya}</strong></div>`;
    }
    
    details.innerHTML = html;
    
    goToStep('success', 'Natija');
    
    // Clear forms
    document.getElementById('kirim-form').reset();
    document.getElementById('chiqim-form').reset();
    kirimFoizVal.textContent = '0%';
    kirimUshlangan.textContent = '0';
    kirimSof.textContent = '0';
}

document.getElementById('btn-new-record').addEventListener('click', () => {
    state.selectedClient = null;
    state.direction = null;
    goToStep(1, 'Klientlar', true);
});

document.getElementById('btn-close-app').addEventListener('click', () => {
    if (tg) {
        tg.close();
    } else {
        showToast("Web App yopilmoqda...");
    }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderClients();
});
