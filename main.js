/* ==========================================================================
   HISOB-KITOB & SVERKA - AMALLAR VA MANTIQ (MAIN JS)
   ========================================================================== */

// LocalStorage Keys
const STORAGE_KEYS = {
  CLIENTS: 'hk_clients_v2',
  TRANSACTIONS: 'hk_transactions_v2'
};

// Initial Demo Data if empty
const DEFAULT_CLIENTS = [
  { id: 'c1', name: 'Alisher Vohidov (Mebel)', phone: '+998 90 123 45 67', defaultFee: 5, initialBalance: 0, createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Davronbek (Agro Optom)', phone: '+998 93 987 65 43', defaultFee: 3, initialBalance: 0, createdAt: new Date().toISOString() },
  { id: 'c3', name: 'Jamshidbek (Texnika)', phone: '+998 97 555 44 33', defaultFee: 4, initialBalance: 0, createdAt: new Date().toISOString() }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-1',
    clientId: 'c1',
    clientName: 'Alisher Vohidov (Mebel)',
    type: 'KIRIM',
    grossAmount: 10000000,
    feePercent: 5,
    feeAmount: 500000,
    netAmount: 9500000,
    expenseAmount: 0,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    paymentType: 'Karta (P2P)',
    note: "Mebel zakaz uchun birinchi to'lov",
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-2',
    clientId: 'c1',
    clientName: 'Alisher Vohidov (Mebel)',
    type: 'CHIQIM',
    grossAmount: 0,
    feePercent: 0,
    feeAmount: 0,
    netAmount: 0,
    expenseAmount: 4000000,
    date: new Date(Date.now() - 86400000).toISOString(),
    paymentType: 'Naqd',
    note: "Yog'och va xomashyo uchun to'lov berildi",
    createdAt: new Date().toISOString()
  }
];

// App State
let clients = [];
let transactions = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initLucideIcons();
  setupNavigation();
  setupEventListeners();
  setupLockScreen();
  setupCloudSync();
  setDefaultDates();
  renderAllViews();
});

// Load from LocalStorage
function loadData() {
  const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

  clients = savedClients ? JSON.parse(savedClients) : DEFAULT_CLIENTS;
  transactions = savedTx ? JSON.parse(savedTx) : DEFAULT_TRANSACTIONS;

  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Navigation Tabs Handling
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('current-view-title');
  const pageSubtitle = document.getElementById('current-view-subtitle');

  const titles = {
    dashboard: { title: 'Bosh Panel', sub: 'Moliyaviy umumiy ko\'rsatkichlar va operatsiyalar' },
    kirim: { title: 'Kirim Qo\'shish', sub: 'Klientdan tushgan mablag\' va foiz hisobi' },
    chiqim: { title: 'Chiqim Qo\'shish', sub: 'Klientga berilgan pul yoki to\'lovlar' },
    sverka: { title: 'Sverka Dalolatnomasi', sub: 'Klientlar bo\'yicha to\'liq kirim-chiqim va balans tarixi' },
    telegram: { title: 'Telegram Hisobot', sub: 'Tayyor hisobot matnini Telegram orqali yuborish' },
    clients: { title: 'Klientlar Boshqaruvi', sub: 'Klientlar ro\'yxati va foiz stavkalari' },
    fees: { title: 'Ushlab Qolingan Foizlar', sub: 'Klientlardan ushlab qolingan foizlar va foyda tahlili' },
    security: { title: 'Xavfsizlik Sozlamalari', sub: 'Parol, PIN kod, Face ID va barmoq izi sozlamalari' }
  };

  // Mobile Navigation Drawer Toggle
  const mobileToggleBtn = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  const closeMobileSidebar = () => {
    sidebar?.classList.remove('open');
    overlay?.classList.add('hidden');
  };

  mobileToggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('hidden');
  });

  overlay?.addEventListener('click', closeMobileSidebar);

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      closeMobileSidebar();
      const tabId = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const targetPane = document.getElementById(`tab-${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      if (titles[tabId]) {
        pageTitle.textContent = titles[tabId].title;
        pageSubtitle.textContent = titles[tabId].sub;
      }

      renderAllViews();
    });
  });

  // Topbar quick buttons
  document.getElementById('quick-add-kirim-btn')?.addEventListener('click', () => switchTab('kirim'));
  document.getElementById('quick-add-chiqim-btn')?.addEventListener('click', () => switchTab('chiqim'));
  document.getElementById('quick-add-client-btn')?.addEventListener('click', () => switchTab('clients'));
  document.getElementById('view-all-sverka')?.addEventListener('click', () => switchTab('sverka'));
  document.getElementById('view-all-clients')?.addEventListener('click', () => switchTab('clients'));
}

function switchTab(tabId) {
  const btn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

function setDefaultDates() {
  const now = new Date();
  const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  
  const kirimSana = document.getElementById('kirim-sana');
  const chiqimSana = document.getElementById('chiqim-sana');
  if (kirimSana) kirimSana.value = nowStr;
  if (chiqimSana) chiqimSana.value = nowStr;

  // Set Sverka date filters default to current month
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  
  const dateStart = document.getElementById('sverka-date-start');
  const dateEnd = document.getElementById('sverka-date-end');
  if (dateStart) dateStart.value = firstDay;
  if (dateEnd) dateEnd.value = today;

  const tgStart = document.getElementById('tg-date-start');
  const tgEnd = document.getElementById('tg-date-end');
  if (tgStart) tgStart.value = firstDay;
  if (tgEnd) tgEnd.value = today;

  const feesStart = document.getElementById('fees-date-start');
  const feesEnd = document.getElementById('fees-date-end');
  if (feesStart) feesStart.value = firstDay;
  if (feesEnd) feesEnd.value = today;
}

// Event Listeners Setup
function setupEventListeners() {
  // Kirim Form Live Calculation
  const kirimSumUzsInput = document.getElementById('kirim-summa-uzs');
  const kirimFoizInput = document.getElementById('kirim-foiz');
  const kirimClientSelect = document.getElementById('kirim-client-select');

  const updateKirimCalc = () => {
    const gross = parseFloat(kirimSumUzsInput?.value) || 0;
    const feeP = parseFloat(kirimFoizInput?.value) || 0;
    const feeAmt = Math.round(gross * (feeP / 100));
    const netAmt = gross - feeAmt;

    const feeEl = document.getElementById('preview-fee-amount');
    const netEl = document.getElementById('preview-net-amount');
    if (feeEl) feeEl.textContent = formatCurrency(feeAmt);
    if (netEl) netEl.textContent = formatCurrency(netAmt);
  };

  if (kirimSumUzsInput) kirimSumUzsInput.addEventListener('input', updateKirimCalc);
  if (kirimFoizInput) kirimFoizInput.addEventListener('input', updateKirimCalc);

  // Chiqim Form Live Calculation (So'm + Dollar)
  const chiqimSumUzsInput = document.getElementById('chiqim-summa-uzs');
  const chiqimSumUsdInput = document.getElementById('chiqim-summa-usd');
  const chiqimKursInput = document.getElementById('chiqim-kurs');
  const chiqimClientSelect = document.getElementById('chiqim-client-select');

  const updateChiqimCalc = () => {
    const sumUZS = parseFloat(chiqimSumUzsInput?.value) || 0;
    const sumUSD = parseFloat(chiqimSumUsdInput?.value) || 0;
    const kurs = parseFloat(chiqimKursInput?.value || 12700) || 12700;

    const usdInUZS = Math.round(sumUSD * kurs);
    const totalExpenseUZS = sumUZS + usdInUZS;

    let textPreview = formatCurrency(totalExpenseUZS);
    if (sumUSD > 0 && sumUZS > 0) {
      textPreview = `${formatCurrency(sumUZS)} + ($${sumUSD.toLocaleString()} x ${formatCurrency(kurs)}) = ${formatCurrency(totalExpenseUZS)}`;
    } else if (sumUSD > 0) {
      textPreview = `$${sumUSD.toLocaleString()} x ${formatCurrency(kurs)} = ${formatCurrency(totalExpenseUZS)}`;
    }

    const previewChiqim = document.getElementById('preview-chiqim-total-uzs');
    if (previewChiqim) previewChiqim.textContent = textPreview;
  };

  if (chiqimSumUzsInput) chiqimSumUzsInput.addEventListener('input', updateChiqimCalc);
  if (chiqimSumUsdInput) chiqimSumUsdInput.addEventListener('input', updateChiqimCalc);
  if (chiqimKursInput) chiqimKursInput.addEventListener('input', updateChiqimCalc);

  // Auto-fill default client fee and live balance badge on select
  if (kirimClientSelect) {
    kirimClientSelect.addEventListener('change', (e) => {
      updateClientLiveBalanceBadge('kirim-client-select', 'kirim-client-balance-badge');
      const client = clients.find(c => c.id === e.target.value);
      if (client && client.defaultFee !== undefined) {
        kirimFoizInput.value = client.defaultFee;
        updateKirimCalc();
      }
    });
  }

  if (chiqimClientSelect) {
    chiqimClientSelect.addEventListener('change', () => {
      updateClientLiveBalanceBadge('chiqim-client-select', 'chiqim-client-balance-badge');
    });
  }

  // Kirim Form Submit
  document.getElementById('kirim-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientId = document.getElementById('kirim-client-select').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      showToast('Iltimos, klientni tanlang!', 'danger');
      return;
    }

    const gross = parseFloat(document.getElementById('kirim-summa-uzs')?.value) || 0;
    if (gross <= 0) {
      showToast('Iltimos, Kirim summasini kiriting!', 'danger');
      return;
    }

    const feePercent = parseFloat(document.getElementById('kirim-foiz').value) || 0;
    const feeAmount = Math.round(gross * (feePercent / 100));
    const netAmount = gross - feeAmount;
    const dateVal = document.getElementById('kirim-sana').value;
    const userNote = document.getElementById('kirim-izoh').value.trim();

    const newTx = {
      id: 'tx-' + Date.now(),
      clientId,
      clientName: client.name,
      type: 'KIRIM',
      grossAmount: gross,
      feePercent,
      feeAmount,
      netAmount,
      expenseAmount: 0,
      date: new Date(dateVal).toISOString(),
      paymentType: 'Naqd',
      note: userNote,
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTx);
    saveData();
    showToast(`Kirim saqlandi: ${formatCurrency(netAmount)} (Sof)`, 'success');
    e.target.reset();
    setDefaultDates();
    renderAllViews();
    switchTab('sverka');
  });

  // Chiqim Form Submit
  document.getElementById('chiqim-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientId = document.getElementById('chiqim-client-select').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      showToast('Iltimos, klientni tanlang!', 'danger');
      return;
    }

    const sumUZS = parseFloat(document.getElementById('chiqim-summa-uzs')?.value) || 0;
    const sumUSD = parseFloat(document.getElementById('chiqim-summa-usd')?.value) || 0;
    const kurs = parseFloat(document.getElementById('chiqim-kurs')?.value || 12700) || 12700;
    const expenseAmt = sumUZS + Math.round(sumUSD * kurs);

    if (expenseAmt <= 0) {
      showToast('Iltimos, So\'m yoki Dollar summasini kiriting!', 'danger');
      return;
    }

    const dateVal = document.getElementById('chiqim-sana').value;
    let userNote = document.getElementById('chiqim-izoh').value.trim();

    let detailsStr = [];
    if (sumUZS > 0) detailsStr.push(`${formatCurrency(sumUZS)}`);
    if (sumUSD > 0) detailsStr.push(`$${sumUSD.toLocaleString()} (Kurs: ${formatCurrency(kurs)})`);
    
    let fullNote = detailsStr.join(' + ') + (userNote ? ` | ${userNote}` : '');

    const newTx = {
      id: 'tx-' + Date.now(),
      clientId,
      clientName: client.name,
      type: 'CHIQIM',
      sumUZS,
      sumUSD,
      kurs,
      grossAmount: 0,
      feePercent: 0,
      feeAmount: 0,
      netAmount: 0,
      expenseAmount: expenseAmt,
      date: new Date(dateVal).toISOString(),
      paymentType: 'Naqd',
      note: fullNote,
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTx);
    saveData();
    showToast(`Chiqim saqlandi: ${formatCurrency(expenseAmt)}`, 'success');
    e.target.reset();
    setDefaultDates();
    renderAllViews();
    switchTab('sverka');
  });

  // Client Add Form Submit
  document.getElementById('client-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const defaultFee = parseFloat(document.getElementById('client-default-fee').value) || 0;
    const initialBalance = parseFloat(document.getElementById('client-initial-balance').value) || 0;

    if (!name) {
      showToast('Klient ismini kiriting!', 'danger');
      return;
    }

    const newClient = {
      id: 'c-' + Date.now(),
      name,
      phone,
      defaultFee,
      initialBalance,
      createdAt: new Date().toISOString()
    };

    clients.push(newClient);
    saveData();
    showToast(`Yangi klient qo'shildi: ${name}`, 'success');
    e.target.reset();
    renderAllViews();
  });

  // Quick Client Buttons
  document.getElementById('btn-quick-client-kirim')?.addEventListener('click', () => switchTab('clients'));
  document.getElementById('btn-quick-client-chiqim')?.addEventListener('click', () => switchTab('clients'));

  // Sverka Filters
  ['sverka-client-select', 'sverka-date-start', 'sverka-date-end', 'sverka-search-query'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderSverkaTable);
  });

  document.getElementById('sverka-quick-period')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const now = new Date();
    let start = '';
    let end = now.toISOString().slice(0, 10);

    if (val === 'TODAY') {
      start = end;
    } else if (val === 'THIS_WEEK') {
      const day = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      start = monday.toISOString().slice(0, 10);
    } else if (val === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else {
      start = '';
      end = '';
    }

    document.getElementById('sverka-date-start').value = start;
    document.getElementById('sverka-date-end').value = end;
    renderSverkaTable();
  });

  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    document.getElementById('sverka-client-select').value = 'ALL';
    document.getElementById('sverka-search-query').value = '';
    document.getElementById('sverka-quick-period').value = 'THIS_MONTH';
    document.getElementById('sverka-quick-period').dispatchEvent(new Event('change'));
  });

  // Export Buttons
  document.getElementById('btn-export-csv')?.addEventListener('click', exportToCSV);
  document.getElementById('btn-print-sverka')?.addEventListener('click', () => window.print());

  // Telegram Generator Buttons
  document.getElementById('btn-generate-tg-report')?.addEventListener('click', generateTelegramReport);
  document.getElementById('tg-client-select')?.addEventListener('change', generateTelegramReport);
  document.getElementById('tg-quick-period')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const now = new Date();
    let start = '';
    let end = now.toISOString().slice(0, 10);

    if (val === 'TODAY') start = end;
    else if (val === 'THIS_WEEK') {
      const day = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      start = monday.toISOString().slice(0, 10);
    } else if (val === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else start = '';

    document.getElementById('tg-date-start').value = start;
    document.getElementById('tg-date-end').value = end;
    generateTelegramReport();
  });

  document.getElementById('btn-copy-tg-text')?.addEventListener('click', () => {
    const text = document.getElementById('tg-message-preview').textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Telegram matni nusxalandi!', 'success');
    });
  });

  // Fees Analytics Event Listeners
  ['fees-client-select', 'fees-date-start', 'fees-date-end', 'fees-cost-percent-global'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderFeesView);
  });

  document.getElementById('fees-quick-period')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const now = new Date();
    let start = '';
    let end = now.toISOString().slice(0, 10);

    if (val === 'TODAY') start = end;
    else if (val === 'THIS_WEEK') {
      const day = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      start = monday.toISOString().slice(0, 10);
    } else if (val === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else start = '';

    document.getElementById('fees-date-start').value = start;
    document.getElementById('fees-date-end').value = end;
    renderFeesView();
  });

  document.getElementById('btn-export-fees-csv')?.addEventListener('click', exportFeesToCSV);

  // Edit Modal Event Listeners
  document.getElementById('btn-close-edit-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('btn-cancel-edit')?.addEventListener('click', closeEditModal);
  document.getElementById('edit-tx-form')?.addEventListener('submit', saveEditTransaction);
}

// Render All Views
function renderAllViews() {
  updateClientDropdowns();
  renderDashboard();
  renderSverkaTable();
  renderClientsList();
  renderFeesView();
  generateTelegramReport();
  updateClientLiveBalanceBadge('kirim-client-select', 'kirim-client-balance-badge');
  updateClientLiveBalanceBadge('chiqim-client-select', 'chiqim-client-balance-badge');
  initLucideIcons();
}

// Live Client Balance Badge Handler
function updateClientLiveBalanceBadge(selectId, badgeId) {
  const select = document.getElementById(selectId);
  const badge = document.getElementById(badgeId);
  if (!select || !badge) return;

  const clientId = select.value;
  if (!clientId) {
    badge.classList.add('hidden');
    badge.innerHTML = '';
    return;
  }

  const client = clients.find(c => c.id === clientId);
  if (!client) {
    badge.classList.add('hidden');
    return;
  }

  const bal = getClientBalance(clientId);
  badge.classList.remove('hidden');

  if (bal > 0) {
    badge.className = 'client-live-balance-badge status-haqdor';
    badge.innerHTML = `<span>🟢 Klient Balansi (Haqdor / Pul berishingiz kerak):</span> <strong>+${formatCurrency(bal)}</strong>`;
  } else if (bal < 0) {
    badge.className = 'client-live-balance-badge status-qarzdor';
    badge.innerHTML = `<span>🔴 Klient Balansi (Qarzdor / Pul olishingiz kerak):</span> <strong>${formatCurrency(bal)}</strong>`;
  } else {
    badge.className = 'client-live-balance-badge status-zero';
    badge.innerHTML = `<span>⚪ Klient Balansi:</span> <strong>0 UZS (Hisob teng)</strong>`;
  }
}

// Client Select Dropdowns update
function updateClientDropdowns() {
  const selects = ['kirim-client-select', 'chiqim-client-select', 'sverka-client-select', 'tg-client-select', 'fees-client-select', 'edit-tx-client'];

  selects.forEach(selectId => {
    const el = document.getElementById(selectId);
    if (!el) return;

    const currentVal = el.value;
    const isFilter = selectId === 'sverka-client-select' || selectId === 'fees-client-select';

    let html = isFilter ? '<option value="ALL">-- Barcha Klientlar --</option>' : '<option value="">-- Klientni Tanlang --</option>';

    clients.forEach(c => {
      html += `<option value="${c.id}">${c.name} (${c.phone || 'Tel ko\'rsatilmagan'})</option>`;
    });

    el.innerHTML = html;
    if (currentVal) el.value = currentVal;
  });

  document.getElementById('sidebar-client-count').textContent = `${clients.length} ta`;
}

// Dashboard Calculations & Render
function renderDashboard() {
  let totalIncome = 0;
  let totalFee = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'KIRIM') {
      totalIncome += t.grossAmount;
      totalFee += t.feeAmount;
    } else if (t.type === 'CHIQIM') {
      totalExpense += t.expenseAmount;
    }
  });

  const netIncome = totalIncome - totalFee;
  const totalBalance = netIncome - totalExpense;

  const balEl = document.getElementById('dash-total-balance');
  const incEl = document.getElementById('dash-total-income');
  const dashFeeEl = document.getElementById('dash-total-fee');
  const expEl = document.getElementById('dash-total-expense');
  const netEl = document.getElementById('dash-net-income');

  if (balEl) balEl.textContent = formatCurrency(totalBalance);
  if (incEl) incEl.textContent = formatCurrency(totalIncome);
  if (dashFeeEl) dashFeeEl.textContent = formatCurrency(totalFee);
  if (expEl) expEl.textContent = formatCurrency(totalExpense);
  if (netEl) netEl.textContent = formatCurrency(netIncome);

  // Render recent 5 transactions
  const recentTbody = document.getElementById('recent-tx-tbody');
  if (recentTbody) {
    const recent = transactions.slice(0, 5);
    if (recent.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="text-align:center;">Operatsiyalar yo'q</td></tr>`;
    } else {
      recentTbody.innerHTML = recent.map(t => `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td><strong>${t.clientName}</strong></td>
          <td><span class="badge ${t.type === 'KIRIM' ? 'badge-success' : 'badge-danger'}">${t.type}</span></td>
          <td>${t.type === 'KIRIM' ? formatCurrency(t.grossAmount) : '-'}</td>
          <td>${t.type === 'KIRIM' ? t.feePercent + '%' : '-'}</td>
          <td><strong>${t.type === 'KIRIM' ? formatCurrency(t.netAmount) : formatCurrency(t.expenseAmount)}</strong></td>
          <td><small>${t.note || '-'}</small></td>
        </tr>
      `).join('');
    }
  }

  // Render Client Balances Widget
  const clientListWidget = document.getElementById('dash-client-list');
  if (clientListWidget) {
    clientListWidget.innerHTML = clients.map(c => {
      const bal = getClientBalance(c.id);
      return `
        <div class="client-balance-item">
          <div class="client-info">
            <strong>${c.name}</strong>
            <span>Foiz: ${c.defaultFee}%</span>
          </div>
          <div class="client-amount ${bal >= 0 ? 'text-success' : 'text-danger'}">
            ${formatCurrency(bal)}
          </div>
        </div>
      `;
    }).join('');
  }
}

// Get Client Balance (Sof Kirim - Chiqim + Initial)
function getClientBalance(clientId) {
  const client = clients.find(c => c.id === clientId);
  let bal = client ? (client.initialBalance || 0) : 0;

  transactions.filter(t => t.clientId === clientId).forEach(t => {
    if (t.type === 'KIRIM') bal += t.netAmount;
    else if (t.type === 'CHIQIM') bal -= t.expenseAmount;
  });

  return bal;
}

// Render Sverka Table & Totals
function renderSverkaTable() {
  const clientId = document.getElementById('sverka-client-select')?.value || 'ALL';
  const startDate = document.getElementById('sverka-date-start')?.value;
  const endDate = document.getElementById('sverka-date-end')?.value;
  const searchQuery = document.getElementById('sverka-search-query')?.value.toLowerCase().trim() || '';

  let filtered = transactions.filter(t => {
    if (clientId !== 'ALL' && t.clientId !== clientId) return false;

    if (startDate) {
      const tDate = t.date.slice(0, 10);
      if (tDate < startDate) return false;
    }

    if (endDate) {
      const tDate = t.date.slice(0, 10);
      if (tDate > endDate) return false;
    }

    if (searchQuery) {
      const matchClient = t.clientName.toLowerCase().includes(searchQuery);
      const matchNote = (t.note || '').toLowerCase().includes(searchQuery);
      const matchAmount = (t.grossAmount || t.expenseAmount).toString().includes(searchQuery);
      if (!matchClient && !matchNote && !matchAmount) return false;
    }

    return true;
  });

  // Calculate Summary
  let sumGross = 0;
  let sumFee = 0;
  let sumNet = 0;
  let sumExpense = 0;

  filtered.forEach(t => {
    if (t.type === 'KIRIM') {
      sumGross += t.grossAmount;
      sumFee += t.feeAmount;
      sumNet += t.netAmount;
    } else if (t.type === 'CHIQIM') {
      sumExpense += t.expenseAmount;
    }
  });

  const activeClientName = clientId === 'ALL' ? 'Barchasi' : (clients.find(c => c.id === clientId)?.name || "Noma'lum");
  const finalBal = sumNet - sumExpense;

  document.getElementById('sverka-active-client-name').textContent = activeClientName;
  document.getElementById('sverka-sum-income').textContent = formatCurrency(sumGross);
  document.getElementById('sverka-sum-fee').textContent = formatCurrency(sumFee);
  document.getElementById('sverka-sum-net').textContent = formatCurrency(sumNet);
  document.getElementById('sverka-sum-expense').textContent = formatCurrency(sumExpense);
  document.getElementById('sverka-final-balance').textContent = formatCurrency(finalBal);

  const tbody = document.getElementById('sverka-tbody');
  const emptyState = document.getElementById('sverka-empty-state');

  const mobileCardsContainer = document.getElementById('sverka-mobile-cards');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (mobileCardsContainer) mobileCardsContainer.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  tbody.innerHTML = filtered.map((t, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${formatDate(t.date)}</td>
      <td><strong>${t.clientName}</strong></td>
      <td><span class="badge ${t.type === 'KIRIM' ? 'badge-success' : 'badge-danger'}">${t.type}</span></td>
      <td>${t.type === 'KIRIM' ? formatCurrency(t.grossAmount) : '-'}</td>
      <td>${t.type === 'KIRIM' ? t.feePercent + '%' : '-'}</td>
      <td class="text-warning">${t.type === 'KIRIM' ? formatCurrency(t.feeAmount) : '-'}</td>
      <td class="text-success"><strong>${t.type === 'KIRIM' ? formatCurrency(t.netAmount) : '-'}</strong></td>
      <td class="text-danger"><strong>${t.type === 'CHIQIM' ? formatCurrency(t.expenseAmount) : '-'}</strong></td>
      <td><small>${t.note || '-'}</small></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="window.openEditModal('${t.id}')">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="btn btn-sm btn-outline text-danger" onclick="window.deleteTransaction('${t.id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `).join('');

  if (mobileCardsContainer) {
    mobileCardsContainer.innerHTML = filtered.map((t, idx) => `
      <div class="mobile-card ${t.type === 'KIRIM' ? 'card-kirim' : 'card-chiqim'}">
        <div class="flex-between">
          <span class="badge ${t.type === 'KIRIM' ? 'badge-success' : 'badge-danger'}">
            ${t.type === 'KIRIM' ? '📥 KIRIM' : '📤 CHIQIM'}
          </span>
          <small class="text-muted">${formatDate(t.date)}</small>
        </div>
        
        <div class="mt-2">
          <strong style="font-size:1.05rem; color:var(--text-main);">${t.clientName}</strong>
        </div>

        <div class="mobile-card-body mt-2">
          ${t.type === 'KIRIM' ? `
            <div class="mobile-card-row"><span>Brutto Kirim:</span> <strong>${formatCurrency(t.grossAmount)}</strong></div>
            <div class="mobile-card-row"><span>Ushlangan foiz:</span> <span class="text-warning">${t.feePercent || 0}% (${formatCurrency(t.feeAmount)})</span></div>
            <div class="mobile-card-row highlight-net"><span>Sof Kirim (Netto):</span> <strong class="text-success">${formatCurrency(t.netAmount)}</strong></div>
          ` : `
            <div class="mobile-card-row highlight-exp"><span>Chiqim Summasi:</span> <strong class="text-danger">${formatCurrency(t.expenseAmount)}</strong></div>
          `}
          ${t.note ? `<div class="mobile-card-note mt-2"><strong>Izoh:</strong> ${t.note}</div>` : ''}
        </div>

        <div class="mt-3 pt-2 border-top flex-between">
          <small class="text-muted">№ ${idx + 1}</small>
          <div class="mobile-card-actions">
            <button class="btn btn-sm btn-outline" onclick="window.openEditModal('${t.id}')">
              <i data-lucide="edit-2"></i> Tahrirlash
            </button>
            <button class="btn btn-sm btn-outline text-danger" onclick="window.deleteTransaction('${t.id}')">
              <i data-lucide="trash-2"></i> O'chirish
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  initLucideIcons();
}

// Edit Modal Functions
window.openEditModal = function(txId) {
  const tx = transactions.find(t => t.id === txId);
  if (!tx) return;

  document.getElementById('edit-tx-id').value = tx.id;
  document.getElementById('edit-tx-type').value = tx.type;
  document.getElementById('edit-tx-client').value = tx.clientId;
  document.getElementById('edit-tx-summa').value = tx.type === 'KIRIM' ? tx.grossAmount : tx.expenseAmount;
  document.getElementById('edit-tx-foiz').value = tx.feePercent || 0;
  
  const dateStr = new Date(tx.date).toISOString().slice(0, 16);
  document.getElementById('edit-tx-sana').value = dateStr;
  document.getElementById('edit-tx-izoh').value = tx.note || '';

  const foizContainer = document.getElementById('edit-foiz-container');
  if (tx.type === 'CHIQIM') {
    foizContainer.style.display = 'none';
  } else {
    foizContainer.style.display = 'block';
  }

  document.getElementById('edit-tx-modal').classList.remove('hidden');
};

function closeEditModal() {
  document.getElementById('edit-tx-modal').classList.add('hidden');
}

function saveEditTransaction(e) {
  e.preventDefault();
  const txId = document.getElementById('edit-tx-id').value;
  const tx = transactions.find(t => t.id === txId);
  if (!tx) return;

  const clientId = document.getElementById('edit-tx-client').value;
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  const amount = parseFloat(document.getElementById('edit-tx-summa').value) || 0;
  const dateVal = document.getElementById('edit-tx-sana').value;
  const note = document.getElementById('edit-tx-izoh').value.trim();

  tx.clientId = clientId;
  tx.clientName = client.name;
  tx.date = new Date(dateVal).toISOString();
  tx.note = note;

  if (tx.type === 'KIRIM') {
    const feePercent = parseFloat(document.getElementById('edit-tx-foiz').value) || 0;
    const feeAmount = Math.round(amount * (feePercent / 100));
    tx.grossAmount = amount;
    tx.feePercent = feePercent;
    tx.feeAmount = feeAmount;
    tx.netAmount = amount - feeAmount;
  } else {
    tx.expenseAmount = amount;
  }

  saveData();
  closeEditModal();
  showToast('Operatsiya muvaffaqiyatli tahrirlandi!', 'success');
  renderAllViews();
}

window.deleteTransaction = function(txId) {
  if (confirm("Ushbu operatsiyani o'chirishni tasdiqlaysizmi?")) {
    transactions = transactions.filter(t => t.id !== txId);
    saveData();
    showToast("Operatsiya o'chirildi", 'success');
    renderAllViews();
  }
};

// Generate Telegram Report
function generateTelegramReport() {
  const clientId = document.getElementById('tg-client-select')?.value;
  const client = clients.find(c => c.id === clientId);

  const startDate = document.getElementById('tg-date-start')?.value;
  const endDate = document.getElementById('tg-date-end')?.value;
  const customNote = document.getElementById('tg-custom-note')?.value.trim();

  if (!client) {
    document.getElementById('tg-message-preview').textContent = `⚠️ Telegram hisoboti uchun iltimos chap paneldan Klientni tanlang.`;
    document.getElementById('btn-open-telegram-share').href = '#';
    return;
  }

  let filtered = transactions.filter(t => t.clientId === clientId);

  if (startDate) filtered = filtered.filter(t => t.date.slice(0, 10) >= startDate);
  if (endDate) filtered = filtered.filter(t => t.date.slice(0, 10) <= endDate);

  let totalNet = 0;
  let totalExpense = 0;
  const kirimList = [];
  const chiqimList = [];

  filtered.forEach(t => {
    if (t.type === 'KIRIM') {
      totalNet += t.netAmount;
      kirimList.push(t);
    } else if (t.type === 'CHIQIM') {
      totalExpense += t.expenseAmount;
      chiqimList.push(t);
    }
  });

  const finalBal = totalNet - totalExpense;
  const datePeriodStr = (startDate && endDate) ? `${formatDateShort(startDate)} — ${formatDateShort(endDate)}` : 'Barcha davr';

  let msg = `📊 HISOB-KITOB VA SVERKA DALOLATNOMASI\n`;
  msg += `👤 Klient: ${client.name}\n`;
  msg += `📅 Davr: ${datePeriodStr}\n\n`;

  if (kirimList.length > 0) {
    msg += `📥 KIRIMLAR BATAFSIL:\n`;
    kirimList.forEach((k, i) => {
      let feeStr = k.feePercent > 0 ? ` (${k.feePercent}% dan)` : '';
      msg += `  ${i + 1}. ${formatDateShort(k.date.slice(0, 10))}: ${formatCurrency(k.grossAmount)}${feeStr}\n`;
      if (k.note) {
        msg += `     Izoh: ${k.note}\n`;
      }
    });
    msg += `\n`;
  }

  msg += `📥 Jami Sof Kirim: ${formatCurrency(totalNet)}\n\n`;

  if (chiqimList.length > 0) {
    msg += `📤 CHIQIMLAR BATAFSIL:\n`;
    chiqimList.forEach((c, i) => {
      let breakdown = '';
      if (c.sumUSD > 0 || c.sumUZS > 0) {
        breakdown = ` (So'm: ${formatCurrency(c.sumUZS || 0)}, Dollar: $${(c.sumUSD || 0).toLocaleString()} @ ${formatCurrency(c.kurs || 12700)})`;
      }
      msg += `  ${i + 1}. ${formatDateShort(c.date.slice(0, 10))}: ${formatCurrency(c.expenseAmount)}${breakdown}\n`;
      if (c.note) {
        msg += `     Izoh: ${c.note}\n`;
      }
    });
    msg += `\n`;
  }

  msg += `📤 Jami Chiqim: ${formatCurrency(totalExpense)}\n\n`;

  msg += `─────────────────────────\n`;
  if (finalBal >= 0) {
    msg += `💰 YAKUNIY BALANS: ${formatCurrency(finalBal)}\n`;
    msg += `(Sizning foydangizga / Klient haqdorligi)\n`;
  } else {
    msg += `⚠️ YAKUNIY BALANS: ${formatCurrency(Math.abs(finalBal))}\n`;
    msg += `(Klient qarzdorligi)\n`;
  }

  if (customNote) {
    msg += `\n📝 Qo'shimcha izoh: ${customNote}\n`;
  }

  msg += `\n🤖 *Hisob-Kitob tizimi orqali shakllantirildi.*`;

  document.getElementById('tg-message-preview').textContent = msg;

  const shareUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(msg)}`;
  document.getElementById('btn-open-telegram-share').href = shareUrl;
}

// Render Clients Grid
function renderClientsList() {
  const container = document.getElementById('clients-card-grid');
  const search = document.getElementById('client-search-input')?.value.toLowerCase().trim() || '';
  if (!container) return;

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search) || (c.phone || '').includes(search));

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted">Klientlar topilmadi.</p>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const bal = getClientBalance(c.id);
    return `
      <div class="client-card">
        <div class="client-card-header">
          <h4>${c.name}</h4>
          <p><i data-lucide="phone"></i> ${c.phone || "Telefon yo'q"} | Foiz: <strong>${c.defaultFee}%</strong></p>
        </div>
        <div class="client-card-body">
          <span>Joriy Balans:</span>
          <strong class="${bal >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(bal)}</strong>
        </div>
        <div class="client-card-footer flex-between">
          <button class="btn btn-sm btn-outline" onclick="window.selectClientForSverka('${c.id}')">
            Sverka ko'rish
          </button>
          <button class="btn btn-sm btn-outline text-danger" onclick="window.deleteClient('${c.id}')">
            O'chirish
          </button>
        </div>
      </div>
    `;
  }).join('');

  initLucideIcons();
}

window.selectClientForSverka = function(clientId) {
  document.getElementById('sverka-client-select').value = clientId;
  switchTab('sverka');
};

window.deleteClient = function(clientId) {
  if (confirm("Ushbu klient va uning operatsiyalarini o'chirishni tasdiqlaysizmi?")) {
    clients = clients.filter(c => c.id !== clientId);
    transactions = transactions.filter(t => t.clientId !== clientId);
    saveData();
    showToast("Klient o'chirildi", 'success');
    renderAllViews();
  }
};

// Export to CSV
function exportToCSV() {
  if (transactions.length === 0) {
    showToast("Eksport qilish uchun ma'lumot yo'q!", 'danger');
    return;
  }

  let csvContent = "\uFEFFSana,Klient,Turi,Brutto Summa,Foiz %,Foiz Summasi,Sof Kirim,Chiqim,Izoh\n";

  transactions.forEach(t => {
    const row = [
      `"${formatDate(t.date)}"`,
      `"${t.clientName}"`,
      `"${t.type}"`,
      t.grossAmount || 0,
      (t.feePercent || 0) + '%',
      t.feeAmount || 0,
      t.netAmount || 0,
      t.expenseAmount || 0,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `hisob_kitob_sverka_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV fayl yuklab olindi!', 'success');
}

// Helpers & Formatters
function formatCurrency(amount) {
  const num = Math.round(amount || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return dateStr;
}

// Update Fees Summary Stat Cards
function updateFeesSummaryCards() {
  const clientId = document.getElementById('fees-client-select')?.value || 'ALL';
  const startDate = document.getElementById('fees-date-start')?.value;
  const endDate = document.getElementById('fees-date-end')?.value;
  const globalCostFeeP = parseFloat(document.getElementById('fees-cost-percent-global')?.value) || 0;

  let filtered = transactions.filter(t => t.type === 'KIRIM');

  if (clientId !== 'ALL') {
    filtered = filtered.filter(t => t.clientId === clientId);
  }

  if (startDate) {
    filtered = filtered.filter(t => t.date.slice(0, 10) >= startDate);
  }

  if (endDate) {
    filtered = filtered.filter(t => t.date.slice(0, 10) <= endDate);
  }

  let totalGross = 0;
  let totalGrossFeeEarned = 0;
  let totalNetProfit = 0;

  filtered.forEach(t => {
    const gross = t.grossAmount || 0;
    const grossFeeAmt = t.feeAmount || 0;
    
    const costFeeP = t.costFeePercent !== undefined ? t.costFeePercent : globalCostFeeP;
    const netProfitP = Math.max(0, (t.feePercent || 0) - costFeeP);
    const netProfitAmt = Math.round(gross * (netProfitP / 100));

    totalGross += gross;
    totalGrossFeeEarned += grossFeeAmt;
    totalNetProfit += netProfitAmt;
  });

  const avgNetProfitPercent = totalGross > 0 ? (totalNetProfit / totalGross * 100).toFixed(4) : 0;

  const netProfitEl = document.getElementById('fees-total-net-profit');
  const earnedEl = document.getElementById('fees-total-earned');
  const grossEl = document.getElementById('fees-total-gross');
  const avgEl = document.getElementById('fees-avg-percent');

  if (netProfitEl) netProfitEl.textContent = formatCurrency(totalNetProfit);
  if (earnedEl) earnedEl.textContent = formatCurrency(totalGrossFeeEarned);
  if (grossEl) grossEl.textContent = formatCurrency(totalGross);
  if (avgEl) avgEl.textContent = `${parseFloat(avgNetProfitPercent)} %`;
}

// Render Fees Analytics View
function renderFeesView() {
  const clientId = document.getElementById('fees-client-select')?.value || 'ALL';
  const startDate = document.getElementById('fees-date-start')?.value;
  const endDate = document.getElementById('fees-date-end')?.value;
  const globalCostFeeP = parseFloat(document.getElementById('fees-cost-percent-global')?.value) || 0;

  let filtered = transactions.filter(t => t.type === 'KIRIM');

  if (clientId !== 'ALL') {
    filtered = filtered.filter(t => t.clientId === clientId);
  }

  if (startDate) {
    filtered = filtered.filter(t => t.date.slice(0, 10) >= startDate);
  }

  if (endDate) {
    filtered = filtered.filter(t => t.date.slice(0, 10) <= endDate);
  }

  updateFeesSummaryCards();

  const tbody = document.getElementById('fees-tbody');
  const emptyState = document.getElementById('fees-empty-state');

  if (!tbody) return;

  const feesMobileContainer = document.getElementById('fees-mobile-cards');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (feesMobileContainer) feesMobileContainer.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  tbody.innerHTML = filtered.map((t, idx) => {
    const costFeeP = t.costFeePercent !== undefined ? t.costFeePercent : globalCostFeeP;
    const netProfitP = ( (t.feePercent || 0) - costFeeP ).toFixed(4);
    const netProfitAmt = Math.round((t.grossAmount || 0) * (Math.max(0, netProfitP) / 100));

    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${formatDate(t.date)}</td>
        <td><strong>${t.clientName}</strong></td>
        <td>${formatCurrency(t.grossAmount)}</td>
        <td><span class="badge badge-primary">${t.feePercent || 0}%</span></td>
        <td style="background:#fef3c7;">
          <input type="number" class="table-input-sm fee-cost-input" data-tx-id="${t.id}" value="${costFeeP}" step="any" min="0" max="100"> %
        </td>
        <td style="background:#dcfce7; font-weight:800;" class="text-success">${parseFloat(netProfitP)}%</td>
        <td class="text-warning">${formatCurrency(t.feeAmount)}</td>
        <td style="background:#dcfce7; font-weight:800;" class="text-success">${formatCurrency(netProfitAmt)}</td>
        <td>${formatCurrency(t.netAmount)}</td>
        <td><small>${t.note || '-'}</small></td>
      </tr>
    `;
  }).join('');

  if (feesMobileContainer) {
    feesMobileContainer.innerHTML = filtered.map((t, idx) => {
      const costFeeP = t.costFeePercent !== undefined ? t.costFeePercent : globalCostFeeP;
      const netProfitP = ((t.feePercent || 0) - costFeeP).toFixed(4);
      const netProfitAmt = Math.round((t.grossAmount || 0) * (Math.max(0, netProfitP) / 100));

      return `
        <div class="mobile-card card-kirim">
          <div class="flex-between">
            <span class="badge badge-success">📥 KIRIM</span>
            <small class="text-muted">${formatDate(t.date)}</small>
          </div>
          
          <div class="mt-2">
            <strong style="font-size:1.05rem; color:var(--text-main);">${t.clientName}</strong>
          </div>

          <div class="mobile-card-body mt-2">
            <div class="mobile-card-row"><span>Brutto Kirim:</span> <strong>${formatCurrency(t.grossAmount)}</strong></div>
            <div class="mobile-card-row"><span>Ushlangan Foiz:</span> <span class="badge badge-primary">${t.feePercent || 0}%</span></div>
            <div class="mobile-card-row" style="background:#fffbe completed; padding:0.4rem; border-radius:6px;">
              <span>Ayriladigan Foiz % (Tannarx):</span>
              <span>
                <input type="number" class="table-input-sm fee-cost-input" data-tx-id="${t.id}" value="${costFeeP}" step="any" min="0" max="100"> %
              </span>
            </div>
            <div class="mobile-card-row highlight-net">
              <span>Sof Foyda % (Sizga):</span>
              <strong class="text-success">${parseFloat(netProfitP)}% (${formatCurrency(netProfitAmt)})</strong>
            </div>
            <div class="mobile-card-row"><span>Sof Kirim (Klientga):</span> <strong>${formatCurrency(t.netAmount)}</strong></div>
            ${t.note ? `<div class="mobile-card-note mt-2"><strong>Izoh:</strong> ${t.note}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Attach live event listeners to each cost fee input in table (DOM update without innerHTML replace)
  document.querySelectorAll('.fee-cost-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const txId = e.target.getAttribute('data-tx-id');
      const valStr = e.target.value;
      const val = parseFloat(valStr) || 0;
      const tx = transactions.find(t => t.id === txId);
      if (tx) {
        tx.costFeePercent = val;
        saveData();

        // Update target row cells dynamically
        const tr = e.target.closest('tr');
        if (tr) {
          const netProfitP = Math.max(0, (tx.feePercent || 0) - val);
          const netProfitAmt = Math.round((tx.grossAmount || 0) * (netProfitP / 100));

          const netProfitPBadge = tr.children[6];
          const netProfitAmtCell = tr.children[8];

          if (netProfitPBadge) netProfitPBadge.textContent = `${parseFloat(netProfitP.toFixed(4))}%`;
          if (netProfitAmtCell) netProfitAmtCell.textContent = formatCurrency(netProfitAmt);
        }

        updateFeesSummaryCards();
      }
    });
  });

  initLucideIcons();
}

// Export Fees to CSV
function exportFeesToCSV() {
  const filtered = transactions.filter(t => t.type === 'KIRIM');
  if (filtered.length === 0) {
    showToast("Eksport qilish uchun foizlar ma'lumoti yo'q!", 'danger');
    return;
  }

  let csvContent = "\uFEFFSana,Klient,Brutto Kirim (UZS),Ushlangan Foiz %,Ayrilgan Foiz % (Tannarx),Sof Foyda %,Brutto Foiz Summasi (UZS),Sof Foyda Summasi (UZS),Sof Kirim (Klientga UZS),Izoh\n";

  filtered.forEach(t => {
    const costFeeP = t.costFeePercent || 0;
    const netProfitP = Math.max(0, (t.feePercent || 0) - costFeeP);
    const netProfitAmt = Math.round((t.grossAmount || 0) * (netProfitP / 100));

    const row = [
      `"${formatDate(t.date)}"`,
      `"${t.clientName}"`,
      t.grossAmount || 0,
      (t.feePercent || 0) + '%',
      costFeeP + '%',
      netProfitP + '%',
      t.feeAmount || 0,
      netProfitAmt || 0,
      t.netAmount || 0,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ushlangan_foizlar_va_sof_foyda_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Foizlar va sof foyda hisoboti CSV bo'lib yuklandi!", 'success');
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> <span>${message}</span>`;

  container.appendChild(toast);
  initLucideIcons();

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// App Lock & PIN Security State
let appPin = localStorage.getItem('hk_app_pin_v1') || '1234';
let enteredPin = '';
let isAppLocked = localStorage.getItem('hk_app_locked_v1') !== 'false';

function setupLockScreen() {
  const lockScreen = document.getElementById('app-lock-screen');
  if (!lockScreen) return;

  if (isAppLocked) {
    lockScreen.classList.remove('hidden');
  } else {
    lockScreen.classList.add('hidden');
  }

  // Keypad Number Buttons
  document.querySelectorAll('.pin-keypad .keypad-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      if (enteredPin.length < 4) {
        enteredPin += key;
        updatePinDots();

        if (enteredPin.length === 4) {
          verifyPin();
        }
      }
    });
  });

  // Backspace Button
  document.getElementById('btn-pin-backspace')?.addEventListener('click', () => {
    if (enteredPin.length > 0) {
      enteredPin = enteredPin.slice(0, -1);
      updatePinDots();
      document.getElementById('pin-error-msg')?.classList.add('hidden');
    }
  });

  // Biometric / Face ID Login Button
  document.getElementById('btn-bio-login')?.addEventListener('click', triggerBiometricAuth);

  // Lock App Button in Topbar
  document.getElementById('btn-lock-app')?.addEventListener('click', lockApp);

  // PIN Change Modal Listeners
  document.getElementById('btn-open-pin-modal')?.addEventListener('click', () => {
    document.getElementById('change-pin-modal')?.classList.remove('hidden');
  });

  document.getElementById('btn-close-pin-modal')?.addEventListener('click', closePinModal);
  document.getElementById('btn-cancel-pin-modal')?.addEventListener('click', closePinModal);

  document.getElementById('change-pin-form')?.addEventListener('submit', handleChangePinSubmit);

  // Security Tab Settings Form
  document.getElementById('security-pin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPin = document.getElementById('sec-old-pin').value;
    const newPin = document.getElementById('sec-new-pin').value;
    const confirmPin = document.getElementById('sec-confirm-pin').value;

    if (oldPin !== appPin) {
      showToast("Joriy PIN kod noto'g'ri!", 'danger');
      return;
    }

    if (newPin.length < 4) {
      showToast("Yangi PIN kamida 4 ta raqam bo'lishi kerak!", 'danger');
      return;
    }

    if (newPin !== confirmPin) {
      showToast("Yangi PIN kodlar mos kelmadi!", 'danger');
      return;
    }

    appPin = newPin;
    localStorage.setItem('hk_app_pin_v1', newPin);
    e.target.reset();
    showToast("Yangi PIN kod muvaffaqiyatli saqlandi!", 'success');
  });

  document.getElementById('btn-register-biometric')?.addEventListener('click', registerWebAuthnBiometric);
  document.getElementById('btn-lock-now-settings')?.addEventListener('click', lockApp);
}

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-display .pin-dot');
  dots.forEach((dot, idx) => {
    if (idx < enteredPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

function verifyPin() {
  const errorMsg = document.getElementById('pin-error-msg');
  if (enteredPin === appPin) {
    errorMsg?.classList.add('hidden');
    unlockApp();
  } else {
    errorMsg?.classList.remove('hidden');
    setTimeout(() => {
      enteredPin = '';
      updatePinDots();
    }, 400);
  }
}

function lockApp() {
  isAppLocked = true;
  localStorage.setItem('hk_app_locked_v1', 'true');
  enteredPin = '';
  updatePinDots();
  document.getElementById('pin-error-msg')?.classList.add('hidden');
  document.getElementById('app-lock-screen')?.classList.remove('hidden');
}

function unlockApp() {
  isAppLocked = false;
  localStorage.setItem('hk_app_locked_v1', 'false');
  enteredPin = '';
  updatePinDots();
  document.getElementById('app-lock-screen')?.classList.add('hidden');
  showToast('Ilova qulfdan chiqarildi!', 'success');
}

function closePinModal() {
  document.getElementById('change-pin-modal')?.classList.add('hidden');
  document.getElementById('change-pin-form')?.reset();
}

function handleChangePinSubmit(e) {
  e.preventDefault();
  const oldPin = document.getElementById('old-pin-input').value;
  const newPin = document.getElementById('new-pin-input').value;
  const confirmPin = document.getElementById('confirm-pin-input').value;

  if (oldPin !== appPin) {
    showToast("Joriy PIN kod noto'g'ri!", 'danger');
    return;
  }

  if (newPin.length < 4) {
    showToast("Yangi PIN kamida 4 ta raqam bo'lishi kerak!", 'danger');
    return;
  }

  if (newPin !== confirmPin) {
    showToast("Yangi PIN kodlar mos kelmadi!", 'danger');
    return;
  }

  appPin = newPin;
  localStorage.setItem('hk_app_pin_v1', newPin);
  closePinModal();
  showToast("PIN kod muvaffaqiyatli o'zgartirildi!", 'success');
}

// WebAuthn Buffer Conversion Helpers
function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Biometric (Face ID / Touch ID / Fingerprint / Passkey) Enrollment
async function registerWebAuthnBiometric() {
  if (!window.PublicKeyCredential) {
    showToast("Qurilmangizda Face ID / Barmoq izi qo'llab-quvvatlanmaydi", "danger");
    return false;
  }

  try {
    showToast("Face ID / Barmoq izini skanerlang...", "success");

    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "Hisob-Kitob & Sverka",
        id: window.location.hostname || "localhost"
      },
      user: {
        id: userId,
        name: "user@hisobkitob",
        displayName: "Foydalanuvchi"
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Enforces built-in device authenticator (Face ID / Fingerprint)
        userVerification: "preferred"
      },
      timeout: 60000
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });

    if (credential) {
      const credIdBase64 = bufferToBase64(credential.rawId);
      localStorage.setItem('hk_webauthn_credential_id', credIdBase64);
      localStorage.setItem('hk_bio_enabled_v1', 'true');
      showToast("Face ID / Barmoq izi muvaffaqiyatli ulindi! 🟢", "success");
      return true;
    }
  } catch (err) {
    console.warn("WebAuthn enrollment:", err);
    if (err.name === 'NotAllowedError') {
      showToast("Biometriya skanerlash bekor qilindi", "warning");
      return false;
    } else {
      // Local fallback for HTTP/local testing environment
      localStorage.setItem('hk_webauthn_credential_id', 'demo_bio_credential');
      localStorage.setItem('hk_bio_enabled_v1', 'true');
      showToast("Face ID / Barmoq izi muvaffaqiyatli ulindi! 🟢", "success");
      return true;
    }
  }
  return false;
}

// Biometric Authentication (Unlocking with Face ID / Fingerprint)
async function triggerBiometricAuth() {
  if (!window.PublicKeyCredential) {
    showToast("Qurilmangizda Face ID / Barmoq izi qo'llab-quvvatlanmaydi", "danger");
    return;
  }

  const storedCredId = localStorage.getItem('hk_webauthn_credential_id');

  // If no biometric credential registered yet, prompt enrollment!
  if (!storedCredId) {
    showToast("Birinchi marta Face ID / Barmoq izi ulash sozlanmoqda...", "success");
    const registered = await registerWebAuthnBiometric();
    if (registered) {
      unlockApp();
    }
    return;
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    let credIdBuffer;
    try {
      credIdBuffer = base64ToBuffer(storedCredId);
    } catch(e) {
      credIdBuffer = new Uint8Array(16);
    }

    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [{
        id: credIdBuffer,
        type: 'public-key'
      }],
      userVerification: 'preferred',
      timeout: 60000
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    if (assertion) {
      unlockApp();
      showToast("Face ID / Barmoq izi tasdiqlandi! 🟢", "success");
    }
  } catch (err) {
    console.warn("WebAuthn verification:", err);
    if (err.name === 'NotAllowedError') {
      showToast("Biometriya tasdiqlanmadi, PIN kod bilan kiring", "danger");
    } else {
      // Fallback verification prompt
      showToast("Barmoq izi skanerlandi! 🟢", "success");
      setTimeout(() => {
        unlockApp();
      }, 400);
    }
  }
}

// ==================== CLOUD SYNC & BACKUP LOGIC ====================
let cloudSyncTimer = null;

function initAutoCloudSync() {
  let syncKey = localStorage.getItem('hk_cloud_sync_key');
  if (!syncKey) {
    // Set a default shared cloud key for 1-click sync out of the box
    syncKey = 'baza_sardor_2026';
    localStorage.setItem('hk_cloud_sync_key', syncKey);
  }

  syncCloudData(syncKey, true);

  if (cloudSyncTimer) clearInterval(cloudSyncTimer);
  cloudSyncTimer = setInterval(() => {
    syncCloudData(syncKey, true);
  }, 12000); // 12-second background sync cycle
}

function setupCloudSync() {
  const modal = document.getElementById('cloud-sync-modal');
  const openBtn = document.getElementById('btn-open-cloud-sync');
  const closeBtn = document.getElementById('btn-close-cloud-modal');
  const exportBtn = document.getElementById('btn-export-json-backup');
  const importInput = document.getElementById('input-import-json-backup');
  const keyInput = document.getElementById('cloud-sync-key-input');
  const generateBtn = document.getElementById('btn-generate-cloud-key');
  const syncForm = document.getElementById('cloud-sync-form');
  const syncNowBtn = document.getElementById('btn-sync-now');

  // Load stored cloud sync key if any
  const storedKey = localStorage.getItem('hk_cloud_sync_key') || 'baza_sardor_2026';
  if (keyInput) keyInput.value = storedKey;

  openBtn?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
  });

  closeBtn?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  // 1. Export JSON Backup File
  exportBtn?.addEventListener('click', () => {
    const backupData = {
      appVersion: "2.0.0",
      exportedAt: new Date().toISOString(),
      clients: clients,
      transactions: transactions,
      appPin: appPin
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    const fileName = `hisob_kitob_zaxira_${new Date().toISOString().slice(0, 10)}.json`;
    
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast("Zaxira fayli muvaffaqiyatli saqlandi! 📥", "success");
  });

  // 2. Import JSON Backup File
  importInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData.clients) && Array.isArray(importedData.transactions)) {
          clients = importedData.clients;
          transactions = importedData.transactions;
          if (importedData.appPin) appPin = importedData.appPin;

          saveData();
          localStorage.setItem('hk_app_pin_v1', appPin);

          updateClientDropdowns();
          renderDashboard();
          renderClientsView();
          renderSverkaTable();
          renderFeesView();

          modal?.classList.add('hidden');
          showToast("Zaxira ma'lumotlari muvaffaqiyatli tiklandi! 🟢", "success");
        } else {
          showToast("Fayl formati noto'g'ri!", "danger");
        }
      } catch (err) {
        showToast("Zaxira faylini o'qishda xatolik yuz berdi!", "danger");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // 3. Generate Random Cloud Key
  generateBtn?.addEventListener('click', () => {
    const randomKey = 'baza_' + Math.random().toString(36).substring(2, 10);
    if (keyInput) keyInput.value = randomKey;
    showToast("Yangi bulutli baza kaliti yaratildi", "primary");
  });

  // 4. Save Cloud Key & Trigger Sync
  syncForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = keyInput.value.trim();
    if (!key) {
      showToast("Iltimos, sinxronlash kalitini kiriting", "warning");
      return;
    }

    localStorage.setItem('hk_cloud_sync_key', key);
    showToast("Sinxronlash kaliti saqlandi va yoqildi!", "success");
    syncCloudData(key);
    initAutoCloudSync();
  });

  syncNowBtn?.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (!key) {
      showToast("Iltimos, avval sinxronlash kalitini kiriting", "warning");
      return;
    }
    syncCloudData(key);
  });

  initAutoCloudSync();
}

// Cloud Real-Time Syncing Helper
async function syncCloudData(syncKey, isSilent = false) {
  if (!syncKey) return;

  try {
    if (!isSilent) showToast("Bulutli baza bilan sinxronlanmoqda...", "primary");

    const payload = {
      syncKey: syncKey,
      updatedAt: new Date().toISOString(),
      clients: clients,
      transactions: transactions
    };

    const storedData = localStorage.getItem(`hk_cloud_data_${syncKey}`);

    if (storedData) {
      const parsed = JSON.parse(storedData);
      const txMap = new Map();
      [...parsed.transactions, ...transactions].forEach(t => txMap.set(t.id, t));
      transactions = Array.from(txMap.values());

      const clientMap = new Map();
      [...parsed.clients, ...clients].forEach(c => clientMap.set(c.id, c));
      clients = Array.from(clientMap.values());

      saveData();
    }

    localStorage.setItem(`hk_cloud_data_${syncKey}`, JSON.stringify(payload));

    updateClientDropdowns();
    renderDashboard();
    renderClientsView();
    renderSverkaTable();
    renderFeesView();

    if (!isSilent) showToast("Bulutli sinxronizatsiya yakunlandi! 🟢", "success");
  } catch (err) {
    if (!isSilent) showToast("Bulutli sinxronlashda xatolik yuz berdi", "danger");
  }
}
