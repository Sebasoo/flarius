const overlay = document.getElementById('overlay');
const methodSheet = document.getElementById('method-sheet');
const confirmSheet = document.getElementById('confirm-sheet');
const successSheet = document.getElementById('success-sheet');
const recentList = document.getElementById('recent-list');
const historyList = document.getElementById('transfer-history-list');
const historySearch = document.getElementById('transfer-history-search');
const stepHome = document.getElementById('step-home');
const stepMethods = document.getElementById('step-methods');
const stepHub = stepMethods;
const stepAmount = document.getElementById('step-amount');
const stepBankDetails = document.getElementById('step-bank-details');
const stepCardDetails = document.getElementById('step-card-details');
const transferBack = document.getElementById('transfer-back');
const methodsBack = document.getElementById('methods-back');
const transferNewBtn = document.getElementById('transfer-new-btn');
const transferScheduledBtn = document.getElementById('transfer-scheduled-btn');
const transferHeaderTitle = document.getElementById('flow-header-title');
const pasteDetectBtn = document.getElementById('paste-detect-btn');
const transferChrome = document.querySelectorAll('.transfer-chrome');
const selectedAvatar = document.getElementById('selected-avatar');
const selectedName = document.getElementById('selected-name');
const selectedSubtitle = document.getElementById('selected-subtitle');
const changeRecipientBtn = document.getElementById('change-recipient');
const amountInput = document.getElementById('transfer-amount');
const amountHint = document.getElementById('amount-hint');
const continueBtn = document.getElementById('continue-btn');
const sendBtn = document.getElementById('send-btn');
const confirmRecipient = document.getElementById('confirm-recipient');
const confirmAccount = document.getElementById('confirm-account');
const confirmAmount = document.getElementById('confirm-amount');
const confirmTotal = document.getElementById('confirm-total');
const successText = document.getElementById('success-text');
const successDoneBtn = document.getElementById('success-done-btn');
const methodTitle = document.getElementById('method-title');
const methodLabel = document.getElementById('method-label');
const methodInput = document.getElementById('method-input');
const methodContinueBtn = document.getElementById('method-continue-btn');
const toast = document.getElementById('toast');
const bankCountryTrigger = document.getElementById('bank-country-trigger');
const bankCountryValue = document.getElementById('bank-country-value');
const bankCurrency = document.getElementById('bank-currency');
const bankAccountLabel = document.getElementById('bank-account-label');
const bankAccountToggle = document.getElementById('bank-account-toggle');
const bankAccountInput = document.getElementById('bank-account-input');
const bankFirstName = document.getElementById('bank-first-name');
const bankLastName = document.getElementById('bank-last-name');
const bankEmail = document.getElementById('bank-email');
const bankContinueBtn = document.getElementById('bank-continue-btn');
const cardNumberInput = document.getElementById('card-number-input');
const cardHolderInput = document.getElementById('card-holder-input');
const cardContinueBtn = document.getElementById('card-continue-btn');
const countryPicker = document.getElementById('country-picker');
const countryPickerBack = document.getElementById('country-picker-back');
const countrySearch = document.getElementById('country-search');
const countryList = document.getElementById('country-list');

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'EUR' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'EUR' },
];

const METHOD_CONFIG = {
  'bank-account': {
    title: 'Bank account transfer',
    label: 'Account number',
    placeholder: 'Enter account number',
    makeContact: (value) => ({
      id: `bank-${value}`,
      name: `Account ···${value.slice(-4)}`,
      subtitle: 'Bank account',
      avatar: 'initials',
      initials: 'BK',
      defaultAmount: 0,
    }),
  },
  international: {
    title: 'International transfer',
    label: 'IBAN or SWIFT',
    placeholder: 'Enter IBAN',
    makeContact: (value) => ({
      id: `intl-${value}`,
      name: value.slice(0, 12) || 'International',
      subtitle: 'International transfer',
      avatar: 'initials',
      initials: 'IN',
      defaultAmount: 0,
    }),
  },
  card: {
    title: 'Card transfer',
    label: 'Card number',
    placeholder: '0000 0000 0000 0000',
    makeContact: (value) => ({
      id: `card-${value}`,
      name: `Card ···${value.replace(/\s/g, '').slice(-4)}`,
      subtitle: 'Card transfer',
      avatar: 'initials',
      initials: 'CD',
      defaultAmount: 0,
    }),
  },
};

let activeSheet = null;
let toastTimer;
let selectedContact = null;
let lastTransfer = null;
let contacts = [];
let activeMethod = null;
let currentStep = 'home';
let historyItems = [];
let selectedCountry = COUNTRIES[0];
let bankAccountMode = 'account';
let transferAccount = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function formatAmount(value) {
  const numeric = String(value).replace(/[^\d.]/g, '');
  const currency = transferAccount?.getCurrency() || FlariusData.getActiveCurrency();
  const meta = FlariusData.getCurrencyMeta(currency);
  if (!numeric) {
    return `0.00 ${meta.symbol}`;
  }
  const parts = numeric.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '00').slice(0, 2).padEnd(2, '0');
  return `${whole}.${fraction} ${meta.symbol}`;
}

function formatPreviewAmount(amount, type) {
  const sign = type === 'in' ? '+' : '-';
  return `${sign}${Math.abs(amount).toFixed(2)}₹`;
}

function openSheet(sheet) {
  activeSheet = sheet;
  overlay?.classList.add('overlay--visible');
  sheet?.classList.add('sheet--visible');
}

function closeSheets() {
  activeSheet = null;
  overlay?.classList.remove('overlay--visible');
  [methodSheet, confirmSheet, successSheet].forEach((sheet) => {
    sheet?.classList.remove('sheet--visible');
  });
}

function renderContactAvatar(contact) {
  return FlariusUI.renderAvatar({
    type: contact.avatar,
    name: contact.name,
    initials: contact.initials,
    assetPrefix: '../assets/',
  });
}

function getFilteredContacts(filter = '') {
  const query = filter.trim().toLowerCase();
  return contacts.filter((contact) => {
    if (!query) return true;
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.subtitle.toLowerCase().includes(query)
    );
  });
}

function renderRecentRecipients(filter = '') {
  if (!recentList) return;

  const filtered = getFilteredContacts(filter);
  if (!filtered.length) {
    recentList.innerHTML = '<p class="transfer-empty">No recipients found</p>';
    return;
  }

  recentList.innerHTML = filtered
    .map(
      (contact) => `
      <button class="transfer-recipient-row" type="button" data-contact-id="${contact.id}">
        ${FlariusUI.renderAvatar({
          type: contact.avatar,
          name: contact.name,
          initials: contact.initials,
          assetPrefix: '../assets/',
        })}
        <span class="transfer-recipient-row__info">
          <span class="transfer-recipient-row__name">${contact.name}</span>
          <span class="transfer-recipient-row__amount transfer-recipient-row__amount--${contact.previewType || 'out'}">
            ${formatPreviewAmount(contact.previewAmount || 0, contact.previewType || 'out')}
          </span>
        </span>
        <span class="transfer-recipient-row__date">${contact.previewDate || ''}</span>
      </button>`
    )
    .join('');

  FlariusUI.staggerChildren(recentList, '.transfer-recipient-row');
}

function setHeaderTitle(title) {
  if (transferHeaderTitle) transferHeaderTitle.textContent = title;
}

function formatCardNumberInput(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatHistoryPreviewAmount(amount) {
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    const whole = Math.floor(abs);
    const fraction = String(Math.round((abs - whole) * 100)).padStart(2, '0');
    const spaced = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `-${spaced}.${fraction}₹`;
  }
  return `-${abs.toFixed(2)}₹`;
}

function renderHistoryAvatar(item) {
  return FlariusUI.renderAvatar({
    type: item.avatar,
    name: item.title,
    initials: item.initials,
    iconKey: item.iconKey,
    emoji: item.avatarEmoji,
    assetPrefix: '../assets/',
  });
}

function getFilteredHistory(query = '') {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return historyItems;
  return historyItems.filter((item) => item.title.toLowerCase().includes(normalized));
}

function renderTransferHistory(query = '') {
  if (!historyList) return;

  const filtered = getFilteredHistory(query);
  if (!filtered.length) {
    historyList.innerHTML = '<p class="transfer-empty">No transfers yet</p>';
    return;
  }

  historyList.innerHTML = filtered
    .map(
      (item) => `
      <button class="transfer-recipient-row" type="button" data-history-id="${item.id}">
        ${renderHistoryAvatar(item)}
        <span class="transfer-recipient-row__info">
          <span class="transfer-recipient-row__name">${item.title}</span>
          <span class="transfer-recipient-row__amount transfer-recipient-row__amount--out">
            ${formatHistoryPreviewAmount(item.amount)}
          </span>
        </span>
        <span class="transfer-recipient-row__date">${FlariusData.formatTransferHistoryDate(item.date)}</span>
      </button>`
    )
    .join('');

  FlariusUI.staggerChildren(historyList, '.transfer-recipient-row');
}

function findContactForHistory(item) {
  const contact = contacts.find((entry) => entry.name === item.title);
  if (contact) return { type: 'transfer', id: contact.id };

  const peer = FlariusData.getFriends().find((entry) => entry.name === item.title);
  if (peer) return { type: 'peer', id: peer.id };

  return null;
}

function openTransferForHistory(item) {
  const match = findContactForHistory(item);
  if (match?.type === 'peer') {
    window.location.href = `peer-transfer.html?peer=${match.id}`;
    return;
  }
  if (match?.type === 'transfer') {
    selectContact(contacts.find((entry) => entry.id === match.id));
    return;
  }

  selectContact({
    id: `history-${item.title}`,
    name: item.title,
    subtitle: 'Previous transfer',
    avatar: item.avatarSrc ? 'photo' : 'initials',
    initials: item.initials || item.title.slice(0, 2).toUpperCase(),
    avatarSrc: item.avatarSrc,
    avatarAlt: item.avatarAlt || item.title,
    defaultAmount: Math.abs(item.amount) || 0,
  });
}

function setVisibleStep(step) {
  currentStep = step;
  const steps = {
    home: stepHome,
    methods: stepMethods,
    amount: stepAmount,
    bank: stepBankDetails,
    card: stepCardDetails,
  };
  Object.entries(steps).forEach(([name, element]) => {
    element?.classList.toggle('transfer-step--hidden', name !== step);
  });

  const showChrome = step === 'home' || step === 'methods';
  setHubChromeVisible(showChrome);
  document.querySelector('.transfer-page')?.classList.toggle('transfer-page--amount', step === 'amount');
  document.querySelector('.transfer-page')?.classList.toggle('transfer-page--bank', step === 'bank' || step === 'card');
  document.querySelector('.transfer-page')?.classList.toggle('transfer-page--history', step === 'home');

  if (transferHeaderTitle) {
    transferHeaderTitle.textContent = step === 'amount' ? 'Transfer' : 'Transfer';
  }

  if (step === 'home') {
    renderTransferHistory(historySearch?.value || '');
  }
}

function showHomeStep() {
  closeCountryPicker();
  setVisibleStep('home');
}

function showMethodsStep() {
  closeCountryPicker();
  setVisibleStep('methods');
}

function setHubChromeVisible(visible) {
  transferChrome.forEach((element) => {
    element.classList.toggle('transfer-chrome--hidden', !visible);
  });
}

function showHubStep() {
  showMethodsStep();
}

function showBankDetailsStep() {
  activeMethod = 'bank-account';
  resetBankForm();
  setVisibleStep('bank');
  bankFirstName?.focus();
}

function showCardDetailsStep() {
  activeMethod = 'card';
  if (cardNumberInput) cardNumberInput.value = '';
  if (cardHolderInput) cardHolderInput.value = '';
  setVisibleStep('card');
  cardNumberInput?.focus();
}

function continueFromCardDetails() {
  const cardNumber = cardNumberInput?.value.replace(/\s/g, '') || '';
  const holderName = cardHolderInput?.value.trim() || '';

  if (cardNumber.length < 16) {
    showToast('Enter a valid 16-digit card number');
    return;
  }
  if (!holderName) {
    showToast('Enter recipient name');
    return;
  }

  const last4 = cardNumber.slice(-4);
  selectContact({
    id: `card-${cardNumber}`,
    name: holderName,
    subtitle: `Card ···${last4}`,
    avatar: 'initials',
    initials: FlariusUI.getInitials(holderName),
    defaultAmount: 0,
    cardDetails: {
      number: cardNumber,
      holder: holderName,
    },
  });
}

function resetBankForm() {
  selectedCountry = COUNTRIES[0];
  bankAccountMode = 'account';
  if (bankCountryValue) bankCountryValue.textContent = selectedCountry.name;
  if (bankCurrency) bankCurrency.value = selectedCountry.currency;
  if (bankAccountLabel) bankAccountLabel.textContent = 'Account number';
  if (bankAccountToggle) bankAccountToggle.textContent = 'Use IBAN';
  if (bankAccountInput) {
    bankAccountInput.value = '';
    bankAccountInput.placeholder = 'Enter account number';
  }
  if (bankFirstName) bankFirstName.value = '';
  if (bankLastName) bankLastName.value = '';
  if (bankEmail) bankEmail.value = '';
}

function renderCountryList(filter = '') {
  if (!countryList) return;

  const query = filter.trim().toLowerCase();
  const filtered = COUNTRIES.filter((country) => {
    if (!query) return true;
    return country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query);
  });

  if (!filtered.length) {
    countryList.innerHTML = '<p class="country-picker__empty">No countries found</p>';
    return;
  }

  countryList.innerHTML = filtered
    .map(
      (country) => `
      <button class="country-picker__item${country.code === selectedCountry.code ? ' country-picker__item--active' : ''}" type="button" data-country-code="${country.code}">
        <span class="country-picker__flag" aria-hidden="true">${country.flag}</span>
        <span class="country-picker__info">
          <span class="country-picker__name">${country.name}</span>
          <span class="country-picker__meta">${country.currency}</span>
        </span>
        <span class="country-picker__check" aria-hidden="true">${country.code === selectedCountry.code ? '✓' : ''}</span>
      </button>`
    )
    .join('');
}

function openCountryPicker() {
  if (!countryPicker) return;
  if (countrySearch) countrySearch.value = '';
  renderCountryList();
  countryPicker.classList.remove('country-picker--hidden');
  countryPicker.setAttribute('aria-hidden', 'false');
  countrySearch?.focus();
}

function closeCountryPicker() {
  if (!countryPicker) return;
  countryPicker.classList.add('country-picker--hidden');
  countryPicker.setAttribute('aria-hidden', 'true');
}

function selectCountry(country) {
  selectedCountry = country;
  if (bankCountryValue) bankCountryValue.textContent = country.name;
  if (bankCurrency) bankCurrency.value = country.currency;
  closeCountryPicker();
}

function toggleBankAccountMode() {
  bankAccountMode = bankAccountMode === 'account' ? 'iban' : 'account';
  if (bankAccountLabel) {
    bankAccountLabel.textContent = bankAccountMode === 'account' ? 'Account number' : 'IBAN';
  }
  if (bankAccountToggle) {
    bankAccountToggle.textContent = bankAccountMode === 'account' ? 'Use IBAN' : 'Use account number';
  }
  if (bankAccountInput) {
    bankAccountInput.value = '';
    bankAccountInput.placeholder =
      bankAccountMode === 'account' ? 'Enter account number' : 'Enter IBAN';
  }
  bankAccountInput?.focus();
}

function continueFromBankDetails() {
  const accountValue = bankAccountInput?.value.trim() || '';
  const firstName = bankFirstName?.value.trim() || '';
  const lastName = bankLastName?.value.trim() || '';
  const email = bankEmail?.value.trim() || '';

  if (!accountValue) {
    showToast(bankAccountMode === 'account' ? 'Enter account number' : 'Enter IBAN');
    return;
  }
  if (!firstName) {
    showToast('Enter first name(s)');
    return;
  }
  if (!lastName) {
    showToast('Enter last name');
    return;
  }
  if (!email || !email.includes('@')) {
    showToast('Enter a valid email');
    return;
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const accountLabel = bankAccountMode === 'account' ? 'Account' : 'IBAN';
  const maskedAccount =
    bankAccountMode === 'account'
      ? `···${accountValue.replace(/\s/g, '').slice(-4)}`
      : accountValue.replace(/\s/g, '').slice(0, 8);

  selectContact({
    id: `bank-${accountValue.replace(/\s/g, '')}`,
    name: fullName,
    subtitle: `${selectedCountry.name} · ${accountLabel} ${maskedAccount}`,
    avatar: 'initials',
    initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
    defaultAmount: 0,
    bankDetails: {
      country: selectedCountry.name,
      currency: bankCurrency?.value || selectedCountry.currency,
      accountType: bankAccountMode,
      accountValue,
      firstName,
      lastName,
      email,
    },
  });
}

function showAmountStep() {
  if (!selectedContact) return;

  setVisibleStep('amount');

  if (selectedAvatar) {
    selectedAvatar.innerHTML = FlariusUI.renderAvatar({
      type: selectedContact.avatar,
      name: selectedContact.name,
      initials: selectedContact.initials,
      assetPrefix: '../assets/',
    });
  }
  if (selectedName) selectedName.textContent = selectedContact.name;
  if (selectedSubtitle) selectedSubtitle.textContent = selectedContact.subtitle;

  const defaultAmount = selectedContact.defaultAmount || 0;
  amountInput.value = formatAmount(String(defaultAmount));
  syncAmountState();
  amountInput?.focus();
}

function selectContact(contact) {
  selectedContact = contact;
  closeSheets();
  showAmountStep();
}

function syncAmountState() {
  const amountValue = FlariusData.parseAmount(amountInput?.value || '0');
  const balance = transferAccount?.getBalance() ?? FlariusData.getBalance();
  const formatted = formatAmount(String(amountValue || 0));

  if (amountInput) amountInput.value = formatted;
  if (continueBtn) continueBtn.disabled = !amountValue || amountValue > balance;

  if (amountHint) {
    if (amountValue > balance) {
      amountHint.textContent = 'Amount exceeds available balance';
      amountHint.classList.add('transfer-amount-block__hint--error');
    } else {
      const currency = transferAccount?.getCurrency() || FlariusData.getActiveCurrency();
      amountHint.textContent = `Available ${FlariusData.formatCurrencyAmount(balance, currency)}`;
      amountHint.classList.remove('transfer-amount-block__hint--error');
    }
  }
}

function openMethodSheet(method) {
  const config = METHOD_CONFIG[method];
  if (!config) return;

  activeMethod = method;
  if (methodTitle) methodTitle.textContent = config.title;
  if (methodLabel) methodLabel.textContent = config.label;
  if (methodInput) {
    methodInput.value = '';
    methodInput.placeholder = config.placeholder;
    methodInput.readOnly = false;
  }

  openSheet(methodSheet);
  methodInput?.focus();
}

function continueFromMethod() {
  const config = METHOD_CONFIG[activeMethod];
  if (!config) return;

  const value = methodInput?.value.trim();
  if (!value) {
    showToast('Enter recipient details');
    return;
  }

  selectContact(config.makeContact(value));
}

function openConfirmSheet() {
  const amountValue = FlariusData.parseAmount(amountInput?.value || '0');
  const balance = transferAccount?.getBalance() ?? FlariusData.getBalance();
  if (!selectedContact || !amountValue || amountValue > balance) return;

  if (confirmAccount) {
    confirmAccount.textContent = FlariusData.formatAccountLabel(transferAccount?.getCurrency());
  }
  if (confirmRecipient) confirmRecipient.textContent = selectedContact.name;
  if (confirmAmount) confirmAmount.textContent = formatAmount(String(amountValue));
  if (confirmTotal) confirmTotal.textContent = formatAmount(String(amountValue));

  openSheet(confirmSheet);
}

function completeTransfer() {
  const amountValue = FlariusData.parseAmount(amountInput?.value || '0');
  if (!selectedContact || !amountValue) return;

  lastTransfer = {
    title: selectedContact.name,
    amount: amountValue,
    currency: transferAccount?.getCurrency() || FlariusData.getActiveCurrency(),
    date: new Date().toISOString(),
    avatar: 'initials',
    initials: selectedContact.initials || FlariusUI.getInitials(selectedContact.name),
  };

  FlariusData.applyTransfer(lastTransfer);
  FlariusData.rememberPendingTransfer(lastTransfer);

  if (successText) {
    successText.textContent = `${formatAmount(String(amountValue))} sent to ${selectedContact.name}`;
  }

  confirmSheet?.classList.remove('sheet--visible');
  openSheet(successSheet);
}

function goHomeAfterTransfer() {
  if (!lastTransfer) {
    window.location.href = '../index.html';
    return;
  }

  const params = new URLSearchParams({
    transferred: '1',
    title: lastTransfer.title,
    amount: String(lastTransfer.amount),
    currency: lastTransfer.currency || FlariusData.getActiveCurrency(),
    date: lastTransfer.date,
    avatar: lastTransfer.avatar,
  });

  if (lastTransfer.initials) params.set('initials', lastTransfer.initials);
  if (lastTransfer.avatarSrc) params.set('avatarSrc', lastTransfer.avatarSrc);
  if (lastTransfer.avatarAlt) params.set('avatarAlt', lastTransfer.avatarAlt);

  window.location.href = `../index.html?${params.toString()}`;
}

function initTransferPage() {
  contacts = FlariusData.getTransferContacts();
  FlariusData.ensureDefaults();
  historyItems = FlariusData.getTransferHistory();
  renderTransferHistory();

  transferAccount = FlariusTransferAccount.mount({
    triggerEl: document.getElementById('transfer-account-btn'),
    flagEl: document.getElementById('transfer-account-flag'),
    nameEl: document.getElementById('transfer-account-name'),
    balanceEl: document.getElementById('transfer-account-balance'),
    sheetEl: document.getElementById('xfer-account-sheet'),
    listEl: document.getElementById('xfer-account-list'),
    closeEl: document.getElementById('xfer-account-close'),
    onChange: syncAmountState,
  });

  const params = new URLSearchParams(window.location.search);
  const preselected = params.get('contact');
  if (preselected === 'history') {
    const historyContact = {
      id: `history-${params.get('name') || 'recipient'}`,
      name: params.get('name') || 'Recipient',
      subtitle: 'Previous transfer',
      avatar: params.get('avatarSrc') ? 'photo' : 'initials',
      initials: params.get('initials') || (params.get('name') || 'R').slice(0, 2).toUpperCase(),
      avatarSrc: params.get('avatarSrc') || undefined,
      avatarAlt: params.get('avatarAlt') || params.get('name') || 'Recipient',
      defaultAmount: parseFloat(params.get('amount') || '0') || 0,
    };
    selectContact(historyContact);
    try {
      window.history.replaceState({}, '', 'transfer.html');
    } catch {
      // file:// may block replaceState
    }
    return;
  }

  if (preselected === 'detected') {
    const detectedContact = {
      id: 'detected-paste',
      name: params.get('name') || 'Sunrise Hotel',
      subtitle: params.get('subtitle') || 'DE89 3704 0044 0532 0130 00',
      avatar: 'initials',
      initials: (params.get('name') || 'SH')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      defaultAmount: parseFloat(params.get('amount') || '50') || 50,
    };
    const detectedCurrency = params.get('currency');
    if (detectedCurrency && FlariusData.getCurrencyMeta(detectedCurrency)) {
      transferAccount?.setCurrency(detectedCurrency);
    }
    selectContact(detectedContact);
    try {
      window.history.replaceState({}, '', 'transfer.html');
    } catch {
      // file:// may block replaceState
    }
    return;
  }

  if (preselected) {
    const contact = contacts.find((item) => item.id === preselected);
    if (contact) selectContact(contact);
    return;
  }

  setVisibleStep('home');
}

historyList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-history-id]');
  if (!button) return;
  const item = historyItems.find((entry) => entry.id === button.dataset.historyId);
  if (item) openTransferForHistory(item);
});

historySearch?.addEventListener('input', () => {
  renderTransferHistory(historySearch.value);
});

transferNewBtn?.addEventListener('click', showMethodsStep);
methodsBack?.addEventListener('click', showHomeStep);
transferScheduledBtn?.addEventListener('click', () => {
  window.location.href = 'scheduled.html';
});

document.querySelectorAll('[data-method]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.method === 'flarius') {
      window.location.href = 'add-friend.html';
      return;
    }
    if (button.dataset.method === 'bank-account') {
      showBankDetailsStep();
      return;
    }
    if (button.dataset.method === 'card') {
      showCardDetailsStep();
      return;
    }
    openMethodSheet(button.dataset.method);
  });
});

pasteDetectBtn?.addEventListener('click', () => {
  window.location.href = 'paste-detect.html';
});

changeRecipientBtn?.addEventListener('click', showHomeStep);

transferBack?.addEventListener('click', () => {
  if (currentStep === 'amount') showHomeStep();
});

document.querySelectorAll('[data-flow-back]').forEach((button) => {
  button.addEventListener('click', showMethodsStep);
});

bankCountryTrigger?.addEventListener('click', openCountryPicker);
countryPickerBack?.addEventListener('click', closeCountryPicker);
countrySearch?.addEventListener('input', () => renderCountryList(countrySearch.value));
countryList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-country-code]');
  if (!button) return;
  const country = COUNTRIES.find((item) => item.code === button.dataset.countryCode);
  if (country) selectCountry(country);
});
bankAccountToggle?.addEventListener('click', toggleBankAccountMode);
bankContinueBtn?.addEventListener('click', continueFromBankDetails);
cardNumberInput?.addEventListener('input', () => {
  if (!cardNumberInput) return;
  const caret = cardNumberInput.selectionStart;
  const before = cardNumberInput.value.length;
  cardNumberInput.value = formatCardNumberInput(cardNumberInput.value);
  const after = cardNumberInput.value.length;
  const nextCaret = Math.max(0, (caret || 0) + (after - before));
  cardNumberInput.setSelectionRange(nextCaret, nextCaret);
});
cardContinueBtn?.addEventListener('click', continueFromCardDetails);

amountInput?.addEventListener('input', syncAmountState);
amountInput?.addEventListener('blur', syncAmountState);

continueBtn?.addEventListener('click', openConfirmSheet);
methodContinueBtn?.addEventListener('click', continueFromMethod);
sendBtn?.addEventListener('click', completeTransfer);
successDoneBtn?.addEventListener('click', goHomeAfterTransfer);
overlay?.addEventListener('click', closeSheets);

initTransferPage();
