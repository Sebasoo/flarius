const FlariusData = (() => {
  const STORAGE_KEY = 'flarius_transactions';
  const BALANCE_KEY = 'flarius_balance';
  const WALLETS_KEY = 'flarius_wallets';
  const ACTIVE_CURRENCY_KEY = 'flarius_active_currency';
  const DEFAULT_ACTIVE_CURRENCY = 'EUR';

  const DEFAULT_WALLETS = {
    EUR: 515,
    INR: 45280,
    USD: 120.5,
    GBP: 62.3,
  };

  const CURRENCIES = {
    INR: { code: 'INR', flag: '🇮🇳', symbol: '₹', name: 'Indian Rupee' },
    USD: { code: 'USD', flag: '🇺🇸', symbol: '$', name: 'US Dollar' },
    EUR: { code: 'EUR', flag: '🇪🇺', symbol: '€', name: 'Euro' },
    GBP: { code: 'GBP', flag: '🇬🇧', symbol: '£', name: 'British Pound' },
  };

  const EXCHANGE_RATES_INR = {
    INR: 1,
    USD: 83.12,
    EUR: 90.45,
    GBP: 105.2,
  };

  let memoryWallets = null;
  let memoryActiveCurrency = DEFAULT_ACTIVE_CURRENCY;
  let memoryTransactions = null;

  const DEFAULT_TRANSACTIONS = [
    {
      id: 'default-1',
      title: 'Payroll Deposit',
      date: '2025-11-07T21:18:00',
      amount: 5400,
      type: 'in',
      avatar: 'icon',
      iconKey: 'payroll',
    },
    {
      id: 'default-2',
      title: 'Chris Marble',
      date: '2025-11-03T15:21:00',
      amount: -15.5,
      type: 'out',
      avatar: 'initials',
      initials: 'CM',
    },
    {
      id: 'default-3',
      title: 'Angela Brown',
      date: '2025-04-14T10:30:00',
      amount: -138,
      type: 'out',
      avatar: 'initials',
      initials: 'AB',
    },
    {
      id: 'default-4',
      title: 'Sam Smith',
      date: '2025-04-07T14:20:00',
      amount: -50,
      type: 'out',
      avatar: 'initials',
      initials: 'SS',
    },
    {
      id: 'default-5',
      title: 'Mike White',
      date: '2025-04-02T09:15:00',
      amount: -15.5,
      type: 'out',
      avatar: 'initials',
      initials: 'MW',
    },
  ];

  const TRANSFER_CONTACTS = [
    {
      id: 'angela',
      name: 'Angela Brown',
      subtitle: 'angela@flarius',
      avatar: 'initials',
      initials: 'AB',
      previewAmount: 138,
      previewType: 'in',
      previewDate: 'Apr, 14',
      defaultAmount: 138,
    },
    {
      id: 'sam',
      name: 'Sam Smith',
      subtitle: 'sam.smith@flarius',
      avatar: 'initials',
      initials: 'SS',
      previewAmount: 50,
      previewType: 'out',
      previewDate: 'Apr, 7',
      defaultAmount: 50,
    },
    {
      id: 'mike',
      name: 'Mike White',
      subtitle: 'mike.white@flarius',
      avatar: 'initials',
      initials: 'MW',
      previewAmount: 15.5,
      previewType: 'in',
      previewDate: 'Apr, 2',
      defaultAmount: 15.5,
    },
  ];

  const P2P_PEERS = [
    {
      id: 'angela',
      name: 'Angela Brown',
      flaTag: 'angela12345',
      phone: '+44 7700 900123',
      email: 'angela@flarius.com',
      avatar: 'initials',
      initials: 'AB',
    },
    {
      id: 'christine',
      name: 'Christine Marble',
      flaTag: 'chrismarble1983',
      phone: '+33 6 98 76 54 32',
      email: 'christine@flarius.com',
      avatar: 'initials',
      initials: 'CM',
    },
  ];

  const FLARIUS_DIRECTORY = [
    ...P2P_PEERS,
    {
      id: 'maria',
      name: 'Maria Lopez',
      flaTag: 'marialopez',
      phone: '+34 612 345 678',
      email: 'maria@flarius.com',
      avatar: 'initials',
      initials: 'ML',
    },
    {
      id: 'james',
      name: 'James Chen',
      flaTag: 'jameschen',
      phone: '+65 9123 4567',
      email: 'james@flarius.com',
      avatar: 'initials',
      initials: 'JC',
    },
  ];

  const FRIENDS_KEY = 'flarius_friends_v1';

  function normalizeFriend(friend) {
    const flaTag = (friend.flaTag || friend.neoTag || '').replace(/^[@#]/, '');
    return {
      ...friend,
      flaTag,
      neoTag: friend.neoTag || `#${flaTag}`,
    };
  }

  function getSavedFriends() {
    if (!storageAvailable()) return [];
    try {
      const raw = localStorage.getItem(FRIENDS_KEY);
      return raw ? JSON.parse(raw).map(normalizeFriend) : [];
    } catch {
      return [];
    }
  }

  function saveFriends(friends) {
    if (!storageAvailable()) return;
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends.map(normalizeFriend)));
  }

  function getFriends() {
    const saved = getSavedFriends();
    if (saved.length) return saved;
    return P2P_PEERS.map(normalizeFriend);
  }

  function getP2pPeers() {
    return getFriends();
  }

  function isFriendSaved(friendId) {
    return getSavedFriends().some((friend) => friend.id === friendId);
  }

  function addFriend(friend) {
    const normalized = normalizeFriend(friend);
    const saved = getSavedFriends();
    if (!saved.some((item) => item.id === normalized.id)) {
      saved.push(normalized);
      saveFriends(saved);
    }
    return normalized;
  }

  function lookupFlariusUser(method, value) {
    const query = String(value || '').trim().toLowerCase();
    if (!query) return null;

    return FLARIUS_DIRECTORY.find((person) => {
      if (method === 'fla-tag') {
        const tag = query.replace(/^[@#]/, '');
        return person.flaTag.toLowerCase() === tag;
      }
      if (method === 'phone') {
        const digits = query.replace(/\D/g, '');
        return person.phone.replace(/\D/g, '').includes(digits) || digits.includes(person.phone.replace(/\D/g, ''));
      }
      if (method === 'email') {
        return person.email.toLowerCase() === query;
      }
      return false;
    }) || null;
  }

  const SCHEDULED_KEY = 'flarius_scheduled_v1';

  const DEFAULT_SCHEDULED = [
    {
      id: 'sched-rent',
      recipient: 'Angela Brown',
      subtitle: 'Bank account ···4821',
      amount: 850,
      currency: 'EUR',
      frequency: 'Monthly',
      nextDate: '2026-07-05',
      initials: 'AB',
      avatar: 'initials',
      status: 'active',
    },
    {
      id: 'sched-family',
      recipient: 'Christine Marble',
      subtitle: '@chrismarble1983',
      amount: 200,
      currency: 'EUR',
      frequency: 'Weekly',
      nextDate: '2026-07-04',
      initials: 'CM',
      avatar: 'initials',
      status: 'active',
    },
  ];

  function getScheduledPayments() {
    if (!storageAvailable()) return DEFAULT_SCHEDULED.map((item) => ({ ...item }));
    try {
      const raw = localStorage.getItem(SCHEDULED_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_SCHEDULED.map((item) => ({ ...item }));
    } catch {
      return DEFAULT_SCHEDULED.map((item) => ({ ...item }));
    }
  }

  function saveScheduledPayments(items) {
    if (!storageAvailable()) return;
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(items));
  }

  function addScheduledPayment(payment) {
    const items = getScheduledPayments();
    items.unshift(payment);
    saveScheduledPayments(items);
    return payment;
  }

  function formatScheduledDate(value) {
    const date = new Date(value);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  function getTransferContacts() {
    return TRANSFER_CONTACTS.map((contact) => ({ ...contact }));
  }

  function migrateTransaction(transaction) {
    if (!transaction || typeof transaction !== 'object') return transaction;

    if (transaction.title === 'Payroll Deposit' || transaction.iconKey === 'payroll') {
      return {
        ...transaction,
        avatar: 'icon',
        iconKey: 'payroll',
      };
    }

    if (transaction.avatar === 'emoji') {
      return transaction;
    }

    if (transaction.avatar === 'icon') {
      return transaction;
    }

    if (transaction.avatar === 'brand' || transaction.avatar === 'photo') {
      return {
        ...transaction,
        avatar: 'initials',
        initials: transaction.initials || FlariusUI.getInitials(transaction.title || transaction.avatarAlt || ''),
      };
    }

    if (transaction.avatar === 'initials' && !transaction.initials) {
      return {
        ...transaction,
        initials: FlariusUI.getInitials(transaction.title || ''),
      };
    }

    return transaction;
  }

  function getTransactions() {
    if (!storageAvailable()) {
      const source = memoryTransactions ? [...memoryTransactions] : [...DEFAULT_TRANSACTIONS];
      return source.map(migrateTransaction);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [...DEFAULT_TRANSACTIONS];
      const parsed = JSON.parse(stored);
      const list = Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_TRANSACTIONS];
      return list.map(migrateTransaction);
    } catch {
      const source = memoryTransactions ? [...memoryTransactions] : [...DEFAULT_TRANSACTIONS];
      return source.map(migrateTransaction);
    }
  }

  function ensureDefaults() {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        saveTransactions([...DEFAULT_TRANSACTIONS]);
      }
      ensureWalletDefaults();
      ensureActiveCurrencyDefault();
    } catch {
      // localStorage unavailable (e.g. some file:// contexts)
    }
  }

  function ensureActiveCurrencyDefault() {
    if (!getActiveCurrencyRaw()) {
      setActiveCurrency(DEFAULT_ACTIVE_CURRENCY);
    }
  }

  function getActiveCurrencyRaw() {
    if (!storageAvailable()) {
      return memoryActiveCurrency || null;
    }

    try {
      return localStorage.getItem(ACTIVE_CURRENCY_KEY);
    } catch {
      return memoryActiveCurrency || null;
    }
  }

  function getActiveCurrency() {
    const stored = getActiveCurrencyRaw();
    if (stored && CURRENCIES[stored]) return stored;
    return DEFAULT_ACTIVE_CURRENCY;
  }

  function setActiveCurrency(currency) {
    if (!CURRENCIES[currency]) return false;
    memoryActiveCurrency = currency;
    if (!storageAvailable()) return true;

    try {
      localStorage.setItem(ACTIVE_CURRENCY_KEY, currency);
      return true;
    } catch {
      return false;
    }
  }

  function ensureWalletDefaults() {
    const wallets = getWalletsRaw();
    if (!wallets) {
      const legacyBalance = readLegacyBalance();
      saveWallets({
        ...DEFAULT_WALLETS,
        INR: legacyBalance ?? DEFAULT_WALLETS.INR,
      });
    }
  }

  function readLegacyBalance() {
    if (!storageAvailable()) return null;

    try {
      const stored = localStorage.getItem(BALANCE_KEY);
      if (stored === null || stored === '') return null;
      return parseFloat(stored);
    } catch {
      return null;
    }
  }

  function getWalletsRaw() {
    if (!storageAvailable()) {
      return memoryWallets ? { ...memoryWallets } : null;
    }

    try {
      const stored = localStorage.getItem(WALLETS_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return memoryWallets ? { ...memoryWallets } : null;
    }
  }

  function saveWallets(wallets) {
    memoryWallets = { ...wallets };
    if (!storageAvailable()) return true;

    try {
      localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
      return true;
    } catch {
      return false;
    }
  }

  function getWallets() {
    return getWalletsRaw() || { ...DEFAULT_WALLETS };
  }

  function getWalletBalance(currency) {
    const wallets = getWallets();
    return wallets[currency] ?? 0;
  }

  function setWalletBalance(currency, amount) {
    const wallets = getWallets();
    wallets[currency] = Math.round(amount * 100) / 100;
    saveWallets(wallets);
    return wallets[currency];
  }

  function getCurrencies() {
    return Object.values(CURRENCIES);
  }

  function getCurrencyMeta(code) {
    return CURRENCIES[code] || { code, flag: '💱', symbol: code, name: code };
  }

  function convertAmount(amount, from, to) {
    const value = parseFloat(amount) || 0;
    if (!value || from === to) return 0;
    const fromRate = EXCHANGE_RATES_INR[from] || 1;
    const toRate = EXCHANGE_RATES_INR[to] || 1;
    const inrValue = value * fromRate;
    return Math.round((inrValue / toRate) * 100) / 100;
  }

  function getExchangeRate(from, to) {
    const fromRate = EXCHANGE_RATES_INR[from] || 1;
    const toRate = EXCHANGE_RATES_INR[to] || 1;
    return fromRate / toRate;
  }

  function formatCurrencyAmount(amount, currency, { compact = false } = {}) {
    const meta = getCurrencyMeta(currency);
    const value = (parseFloat(amount) || 0).toFixed(2);
    if (compact) return `${meta.symbol}${value}`;
    return `${value} ${currency}`;
  }

  function formatExchangeRate(from, to) {
    const rate = getExchangeRate(from, to);
    if (rate >= 1) {
      return `1 ${from} = ${rate.toFixed(4).replace(/\.?0+$/, '')} ${to}`;
    }
    const inverse = 1 / rate;
    return `1 ${to} = ${inverse.toFixed(4).replace(/\.?0+$/, '')} ${from}`;
  }

  function applyExchange({ from, to, fromAmount, toAmount }) {
    const sellAmount = parseFloat(fromAmount) || 0;
    const buyAmount = parseFloat(toAmount) || 0;
    if (!sellAmount || !buyAmount || from === to) return false;

    const wallets = getWallets();
    if (sellAmount > (wallets[from] || 0)) return false;

    wallets[from] = Math.round((wallets[from] - sellAmount) * 100) / 100;
    wallets[to] = Math.round(((wallets[to] || 0) + buyAmount) * 100) / 100;
    saveWallets(wallets);

    addTransaction({
      title: `Exchange ${from} → ${to}`,
      date: new Date().toISOString(),
      amount: from === 'INR' ? -sellAmount : -convertAmount(sellAmount, from, 'INR'),
      type: 'out',
      avatar: 'emoji',
      avatarEmoji: '💱',
    });

    return true;
  }

  function storageAvailable() {
    try {
      const probe = '__flarius_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  function saveTransactions(transactions) {
    memoryTransactions = [...transactions];
    if (!storageAvailable()) return true;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      return true;
    } catch {
      return false;
    }
  }

  function rememberPendingPayment(payment) {
    try {
      sessionStorage.setItem('flarius_pending_payment', JSON.stringify(payment));
      return true;
    } catch {
      return false;
    }
  }

  function clearPendingPayment() {
    try {
      sessionStorage.removeItem('flarius_pending_payment');
    } catch {
      // ignore
    }
  }

  function consumePendingPayment() {
    try {
      const raw = sessionStorage.getItem('flarius_pending_payment');
      if (!raw) return null;
      sessionStorage.removeItem('flarius_pending_payment');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function isDuplicateOperation(operation) {
    const amount = Math.abs(parseFloat(operation.amount) || 0);
    const title = operation.title || 'Operation';
    const date = operation.date || '';

    return getTransactions().some((tx) => {
      if (tx.title !== title) return false;
      if (Math.abs(tx.amount) !== amount) return false;
      if (date && tx.date === date) return true;
      if (!date || !tx.date) return false;
      return Math.abs(new Date(tx.date) - new Date(date)) < 5000;
    });
  }

  function isDuplicatePayment(payment) {
    return isDuplicateOperation(payment);
  }

  function applyPayment(payment) {
    if (!payment || !payment.amount) return false;
    if (isDuplicatePayment(payment)) return false;

    addTransaction({
      title: payment.title || 'Payment',
      date: payment.date || new Date().toISOString(),
      amount: -Math.abs(payment.amount),
      type: 'out',
      avatar: payment.avatar || 'emoji',
      avatarEmoji: payment.avatarEmoji || '☕',
    });
    deductBalance(Math.abs(payment.amount));
    return true;
  }

  function importPaymentFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') !== '1') return false;

    const amount = parseFloat(params.get('amount') || '0');
    if (!amount) return false;

    const applied = applyPayment({
      title: params.get('title') || 'Payment',
      date: params.get('date') || new Date().toISOString(),
      amount,
      avatar: 'emoji',
      avatarEmoji: decodeURIComponent(params.get('emoji') || '☕'),
    });

    if (applied) {
      clearPendingPayment();
      try {
        const cleanUrl = window.location.pathname.split('/').pop() || 'index.html';
        window.history.replaceState({}, '', cleanUrl);
      } catch {
        // file:// may block replaceState
      }
    }

    return applied;
  }

  function rememberPendingTransfer(transfer) {
    try {
      sessionStorage.setItem('flarius_pending_transfer', JSON.stringify(transfer));
      return true;
    } catch {
      return false;
    }
  }

  function clearPendingTransfer() {
    try {
      sessionStorage.removeItem('flarius_pending_transfer');
    } catch {
      // ignore
    }
  }

  function consumePendingTransfer() {
    try {
      const raw = sessionStorage.getItem('flarius_pending_transfer');
      if (!raw) return null;
      sessionStorage.removeItem('flarius_pending_transfer');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function applyTransfer(transfer) {
    if (!transfer || !transfer.amount) return false;
    if (isDuplicateOperation(transfer)) return false;

    const currency = transfer.currency || getActiveCurrency();
    const amount = Math.abs(transfer.amount);
    if (!deductFromWallet(currency, amount)) return false;

    const transaction = {
      title: transfer.title || transfer.name || 'Transfer',
      date: transfer.date || new Date().toISOString(),
      amount: -amount,
      type: 'out',
      avatar: transfer.avatar || 'initials',
      initials: transfer.initials,
      avatarSrc: transfer.avatarSrc,
      avatarAlt: transfer.avatarAlt || transfer.title,
      avatarEmoji: transfer.avatarEmoji,
      currency,
    };

    addTransaction(transaction);
    return true;
  }

  function importTransferFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('transferred') !== '1') return false;

    const amount = parseFloat(params.get('amount') || '0');
    if (!amount) return false;

    const avatar = params.get('avatar') || 'initials';
    const transfer = {
      title: params.get('title') || 'Transfer',
      date: params.get('date') || new Date().toISOString(),
      amount,
      currency: params.get('currency') || getActiveCurrency(),
      avatar,
      initials: params.get('initials') || undefined,
      avatarSrc: params.get('avatarSrc') || undefined,
      avatarAlt: params.get('avatarAlt') || undefined,
      avatarEmoji: params.get('emoji') || undefined,
    };

    const applied = applyTransfer(transfer);

    if (applied) {
      clearPendingTransfer();
      try {
        const cleanUrl = window.location.pathname.split('/').pop() || 'index.html';
        window.history.replaceState({}, '', cleanUrl);
      } catch {
        // file:// may block replaceState
      }
    }

    return applied;
  }

  function addTransaction(transaction) {
    const transactions = getTransactions();
    transactions.unshift({
      id: `tx-${Date.now()}`,
      ...transaction,
    });
    saveTransactions(transactions);
    return transactions;
  }

  function getBalance() {
    return getWalletBalance(getActiveCurrency());
  }

  function setBalance(amount) {
    return setWalletBalance(getActiveCurrency(), amount);
  }

  function deductFromWallet(currency, amount) {
    const value = Math.abs(parseFloat(amount) || 0);
    if (!value) return false;

    const wallets = getWallets();
    const current = wallets[currency] ?? 0;
    if (value > current) return false;

    setWalletBalance(currency, current - value);
    return true;
  }

  function deductBalance(amount) {
    return deductFromWallet(getActiveCurrency(), amount);
  }

  function parseAmount(value) {
    const numeric = String(value).replace(/[^\d.]/g, '');
    return parseFloat(numeric) || 0;
  }

  function formatBalance(amount, currency = getActiveCurrency()) {
    const meta = getCurrencyMeta(currency);
    const value = (parseFloat(amount) || 0).toFixed(2);
    return `${value} ${meta.symbol}`;
  }

  function formatAccountLabel(currency = getActiveCurrency()) {
    return getCurrencyMeta(currency).name;
  }

  function formatTransactionDate(value) {
    const date = new Date(value);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]}, ${hours}:${minutes}`;
  }

  function formatTransactionAmount(amount, type) {
    const abs = Math.abs(amount);
    const whole = Math.floor(abs);
    const fraction = String(Math.round((abs - whole) * 100)).padStart(2, '0');
    const spaced = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (type === 'in') return `+ ${spaced}.${fraction}₹`;
    return `- ${abs.toFixed(2)}₹`;
  }

  function resolveAsset(path, prefix) {
    if (path.startsWith('http') || path.startsWith('../') || path.startsWith('assets/')) {
      return path;
    }
    return `${prefix}${path}`;
  }

  function formatTransferHistoryDate(value) {
    const date = new Date(value);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]}, ${date.getDate()}`;
  }

  function getTransferHistory() {
    return getTransactions()
      .filter((transaction) => transaction.type === 'out')
      .sort((left, right) => new Date(right.date) - new Date(left.date));
  }

  function renderTransaction(transaction, assetPrefix = 'assets/') {
    const isIncoming = transaction.type === 'in';
    const avatarHtml = FlariusUI.renderTransactionAvatar(transaction, assetPrefix);

    return `
      <article class="transaction" data-id="${transaction.id}">
        <div class="transaction__avatar-wrap">
          ${avatarHtml}
          <div class="transaction__indicator transaction__indicator--${isIncoming ? 'in' : 'out'}">
            <img src="${resolveAsset(`arrow-${isIncoming ? 'in' : 'out'}.svg`, assetPrefix)}" alt="">
          </div>
        </div>
        <div class="transaction__info">
          <p class="transaction__title">${transaction.title}</p>
          <p class="transaction__date">${formatTransactionDate(transaction.date)}</p>
        </div>
        <p class="transaction__amount${isIncoming ? ' transaction__amount--positive' : ''}">
          ${formatTransactionAmount(transaction.amount, transaction.type)}
        </p>
      </article>`;
  }

  function renderTransactionList(container, limit, assetPrefix) {
    if (!container) return;
    const transactions = getTransactions().slice(0, limit);
    container.innerHTML = transactions.map((tx) => renderTransaction(tx, assetPrefix)).join('');
    FlariusUI.staggerChildren(container, '.transaction');
  }

  function renderBalance(element) {
    if (!element) return;
    element.textContent = formatBalance(getBalance(), getActiveCurrency());
  }

  function renderAccountOptions(container) {
    if (!container) return;

    const active = getActiveCurrency();
    const wallets = getWallets();

    container.innerHTML = getCurrencies()
      .map((currency) => {
        const balance = wallets[currency.code] ?? 0;
        const selected = currency.code === active;
        return `
          <button class="sheet__option sheet__option--currency${selected ? ' sheet__option--selected' : ''}" type="button" data-currency="${currency.code}">
            <span class="sheet__option__flag" aria-hidden="true">${currency.flag}</span>
            <span class="sheet__option__text">
              <span class="sheet__option__name">${currency.name}</span>
              <span class="sheet__option__balance">${formatCurrencyAmount(balance, currency.code, { compact: true })}</span>
            </span>
          </button>`;
      })
      .join('');
  }

  function bootstrapHome() {
    ensureDefaults();

    let paymentApplied = importPaymentFromUrl();
    let transferApplied = false;

    if (!paymentApplied) {
      transferApplied = importTransferFromUrl();
    }

    if (!paymentApplied && !transferApplied) {
      const pendingPayment = consumePendingPayment();
      if (pendingPayment) paymentApplied = applyPayment(pendingPayment);
    }

    if (!paymentApplied && !transferApplied) {
      const pendingTransfer = consumePendingTransfer();
      if (pendingTransfer) transferApplied = applyTransfer(pendingTransfer);
    }

    return { paymentApplied, transferApplied };
  }

  function resetDemo() {
    memoryTransactions = [...DEFAULT_TRANSACTIONS];
    memoryWallets = { ...DEFAULT_WALLETS };
    memoryActiveCurrency = DEFAULT_ACTIVE_CURRENCY;
    clearPendingPayment();
    clearPendingTransfer();

    if (!storageAvailable()) {
      if (typeof FlariusAuth !== 'undefined') FlariusAuth.reset();
      return true;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
      localStorage.setItem(WALLETS_KEY, JSON.stringify(DEFAULT_WALLETS));
      localStorage.setItem(ACTIVE_CURRENCY_KEY, DEFAULT_ACTIVE_CURRENCY);
      localStorage.removeItem(BALANCE_KEY);
      localStorage.removeItem(FRIENDS_KEY);
      localStorage.removeItem(SCHEDULED_KEY);
      if (typeof FlariusAuth !== 'undefined') FlariusAuth.reset();
      return true;
    } catch {
      return false;
    }
  }

  return {
    addTransaction,
    applyExchange,
    applyPayment,
    applyTransfer,
    bootstrapHome,
    clearPendingPayment,
    clearPendingTransfer,
    convertAmount,
    deductBalance,
    deductFromWallet,
    ensureDefaults,
    formatAccountLabel,
    formatBalance,
    formatCurrencyAmount,
    formatExchangeRate,
    formatTransferHistoryDate,
    getActiveCurrency,
    getBalance,
    getCurrencies,
    getCurrencyMeta,
    getExchangeRate,
    getTransactions,
    getTransferHistory,
    getWalletBalance,
    getWallets,
    getP2pPeers,
    getFriends,
    addFriend,
    lookupFlariusUser,
    isFriendSaved,
    getScheduledPayments,
    addScheduledPayment,
    formatScheduledDate,
    getTransferContacts,
    importPaymentFromUrl,
    importTransferFromUrl,
    parseAmount,
    rememberPendingPayment,
    rememberPendingTransfer,
    renderAccountOptions,
    renderBalance,
    renderTransactionList,
    resetDemo,
    setActiveCurrency,
    storageAvailable,
  };
})();
