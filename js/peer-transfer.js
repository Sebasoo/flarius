const stepPeers = document.getElementById('p2p-step-peers');
const stepDetails = document.getElementById('p2p-step-details');
const stepSuccess = document.getElementById('p2p-step-success');
const navTitle = document.getElementById('p2p-nav-title');
const backBtn = document.getElementById('p2p-back');
const peersList = document.getElementById('p2p-peers-list');
const searchInput = document.getElementById('p2p-search');
const changePeerBtn = document.getElementById('p2p-change-peer');
const recipientAvatar = document.getElementById('p2p-recipient-avatar');
const recipientName = document.getElementById('p2p-recipient-name');
const recipientTag = document.getElementById('p2p-recipient-tag');
const amountInput = document.getElementById('p2p-amount');
const sendBtn = document.getElementById('p2p-send-btn');
const doneBtn = document.getElementById('p2p-done-btn');
const downloadBtn = document.getElementById('p2p-download-btn');
const successRoot = document.getElementById('p2p-success');
const successAmount = document.getElementById('p2p-success-amount');
const successSubtitle = document.getElementById('p2p-success-subtitle');
const successCard = document.getElementById('p2p-success-card');
const keypad = document.getElementById('p2p-keypad');
const keypadGrid = document.getElementById('p2p-keypad-grid');
const footer = document.getElementById('p2p-footer');
const toast = document.getElementById('toast');

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '•', '0', '⌫'];

let currentStep = 'peers';
let peers = [];
let selectedPeer = null;
let lastTransfer = null;
let toastTimer;
let payAccount = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function renderPeerAvatar(peer) {
  return FlariusUI.renderAvatar({
    type: peer.avatar,
    name: peer.name,
    initials: peer.initials,
    assetPrefix: '../assets/',
    size: 'sm',
  });
}

function getFilteredPeers() {
  const query = searchInput?.value.trim().toLowerCase() || '';
  return peers.filter((peer) => {
    if (!query) return true;
    const tag = peer.flaTag || peer.neoTag || '';
    return peer.name.toLowerCase().includes(query) || tag.toLowerCase().includes(query);
  });
}

function renderPeersList() {
  if (!peersList) return;

  const filtered = getFilteredPeers();
  if (!filtered.length) {
    peersList.innerHTML = `
      <div class="p2p-empty">
        <p>No friends yet</p>
        <button class="cards-empty__btn" type="button" id="p2p-empty-add">Add a friend</button>
      </div>
    `;
    document.getElementById('p2p-empty-add')?.addEventListener('click', () => {
      window.location.href = 'add-friend.html';
    });
    return;
  }

  peersList.innerHTML = filtered
    .map(
      (peer) => `
      <button class="p2p-peer-row" type="button" data-peer-id="${peer.id}">
        ${FlariusUI.renderAvatar({
          type: peer.avatar,
          name: peer.name,
          initials: peer.initials,
          assetPrefix: '../assets/',
          size: 'sm',
        })}
        <span class="p2p-peer-row__info">
          <span class="p2p-peer-row__name">${peer.name}</span>
          <span class="p2p-peer-row__tag">@${peer.flaTag || String(peer.neoTag || '').replace(/^[@#]/, '')}</span>
        </span>
      </button>`
    )
    .join('');

  FlariusUI.staggerChildren(peersList, '.p2p-peer-row');
}

function setStep(step) {
  currentStep = step;
  const steps = { peers: stepPeers, details: stepDetails, success: stepSuccess };
  Object.entries(steps).forEach(([name, element]) => {
    element?.classList.toggle('p2p-step--hidden', name !== step);
  });

  if (navTitle) {
    navTitle.textContent = step === 'details' ? 'Send money' : step === 'success' ? '' : 'Flarius friends';
  }

  navTitle?.classList.toggle('p2p-nav__title--hidden', step === 'success');
  backBtn?.classList.toggle('p2p-nav__back--hidden', step === 'success');
  document.getElementById('p2p-add-friend')?.classList.toggle('p2p-nav__add--hidden', step !== 'peers');
  footer?.classList.toggle('p2p-footer--success', step === 'success');
  keypad?.classList.toggle('p2p-keypad--hidden', step !== 'details');
  sendBtn?.classList.toggle('p2p-send-btn--hidden', step !== 'details');
  doneBtn?.classList.toggle('p2p-done-btn--hidden', step !== 'success');
  document.querySelector('.p2p-page')?.classList.toggle('p2p-page--details', step === 'details');
  document.querySelector('.p2p-page')?.classList.toggle('p2p-page--success', step === 'success');

  if (step === 'details') {
    syncAmountState();
  }

  if (step === 'success') {
    playSuccessAnimation();
  } else {
    doneBtn?.classList.remove('p2p-done-btn--animate');
  }
}

function renderSuccessSummary() {
  if (!lastTransfer || !successCard) return;

  const amountText = FlariusData.formatCurrencyAmount(
    lastTransfer.amount,
    lastTransfer.currency || payAccount?.getCurrency() || FlariusData.getActiveCurrency()
  );
  if (successAmount) {
    successAmount.textContent = amountText;
    successAmount.removeAttribute('aria-hidden');
  }
  if (successSubtitle) {
    successSubtitle.textContent = `Sent to ${lastTransfer.title}`;
  }

  successCard.innerHTML = `
    <div class="p2p-success__row" style="--row-i: 0">
      <span>To</span>
      <strong>${lastTransfer.title}</strong>
    </div>
    <div class="p2p-success__row" style="--row-i: 1">
      <span>FlaTag</span>
      <strong>@${selectedPeer?.flaTag || String(selectedPeer?.neoTag || '').replace(/^[@#]/, '') || '—'}</strong>
    </div>
    <div class="p2p-success__row" style="--row-i: 2">
      <span>Amount</span>
      <strong>${amountText}</strong>
    </div>
    <div class="p2p-success__row" style="--row-i: 3">
      <span>Status</span>
      <strong class="p2p-success__status"><span class="p2p-success__status-dot" aria-hidden="true"></span>Completed</strong>
    </div>
  `;
}

function playSuccessAnimation() {
  renderSuccessSummary();
  if (!successRoot) return;

  successRoot.classList.remove('p2p-success--play');
  doneBtn?.classList.remove('p2p-done-btn--animate');
  void successRoot.offsetWidth;
  successRoot.classList.add('p2p-success--play');
  doneBtn?.classList.add('p2p-done-btn--animate');
}

function updateRecipientCard(peer) {
  if (!peer) return;
  if (recipientAvatar) {
    recipientAvatar.innerHTML = FlariusUI.renderAvatar({
      type: peer.avatar,
      name: peer.name,
      initials: peer.initials,
      assetPrefix: '../assets/',
    });
  }
  if (recipientName) recipientName.textContent = peer.name;
  if (recipientTag) {
    const tag = peer.flaTag || String(peer.neoTag || '').replace(/^[@#]/, '');
    recipientTag.textContent = `@${tag}`;
  }
}

function selectPeer(peer) {
  selectedPeer = peer;
  updateRecipientCard(peer);
  if (amountInput) amountInput.value = '';
  syncAmountState();
  setStep('details');
  amountInput?.focus();
}

function parseAmountValue() {
  return FlariusData.parseAmount(amountInput?.value || '0');
}

function syncAmountState() {
  const amountValue = parseAmountValue();
  const balance = payAccount?.getBalance() ?? FlariusData.getBalance();
  const hasAmount = amountValue > 0;

  sendBtn?.classList.toggle('p2p-send-btn--hidden', !hasAmount);
  if (sendBtn) sendBtn.disabled = !hasAmount || amountValue > balance;
}

function appendDigit(digit) {
  if (!amountInput) return;

  if (digit === '⌫') {
    amountInput.value = amountInput.value.slice(0, -1);
  } else if (digit === '•') {
    if (!amountInput.value.includes('.')) {
      amountInput.value = `${amountInput.value || '0'}.`;
    }
  } else {
    const next = `${amountInput.value}${digit}`;
    if (/^\d*\.?\d{0,2}$/.test(next)) {
      amountInput.value = next;
    }
  }

  syncAmountState();
}

function buildKeypad() {
  if (!keypadGrid) return;

  keypadGrid.innerHTML = KEYPAD_KEYS.map(
    (key) => `<button class="p2p-keypad__key" type="button" data-key="${key}">${key}</button>`
  ).join('');

  keypadGrid.querySelectorAll('[data-key]').forEach((button) => {
    button.addEventListener('click', () => appendDigit(button.dataset.key || ''));
  });
}

function completeTransfer() {
  const amountValue = parseAmountValue();
  const balance = payAccount?.getBalance() ?? FlariusData.getBalance();
  if (!selectedPeer || !amountValue || amountValue > balance) return;

  lastTransfer = {
    title: selectedPeer.name,
    amount: amountValue,
    currency: payAccount?.getCurrency() || FlariusData.getActiveCurrency(),
    date: new Date().toISOString(),
    avatar: 'initials',
    initials: selectedPeer.initials || FlariusUI.getInitials(selectedPeer.name),
  };

  FlariusData.applyTransfer(lastTransfer);
  FlariusData.rememberPendingTransfer(lastTransfer);
  setStep('success');
}

function goHome() {
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

function goBack() {
  if (currentStep === 'peers') {
    window.location.href = 'transfer.html';
    return;
  }
  if (currentStep === 'details') {
    setStep('peers');
  }
}

function initPeerTransfer() {
  peers = FlariusData.getFriends();
  buildKeypad();
  renderPeersList();

  payAccount = FlariusTransferAccount.mount({
    triggerEl: document.getElementById('p2p-account-btn'),
    flagEl: document.getElementById('p2p-account-flag'),
    codeEl: document.getElementById('p2p-account-code'),
    balanceEl: document.getElementById('p2p-account-balance'),
    sheetEl: document.getElementById('xfer-account-sheet'),
    listEl: document.getElementById('xfer-account-list'),
    closeEl: document.getElementById('xfer-account-close'),
    onChange: syncAmountState,
  });

  const preselected = new URLSearchParams(window.location.search).get('peer');
  if (preselected) {
    const peer = peers.find((item) => item.id === preselected);
    if (peer) selectPeer(peer);
  }
}

peersList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-peer-id]');
  if (!button) return;
  const peer = peers.find((item) => item.id === button.dataset.peerId);
  if (peer) selectPeer(peer);
});

searchInput?.addEventListener('input', renderPeersList);
backBtn?.addEventListener('click', goBack);
document.getElementById('p2p-add-friend')?.addEventListener('click', () => {
  window.location.href = 'add-friend.html';
});
changePeerBtn?.addEventListener('click', () => setStep('peers'));

amountInput?.addEventListener('input', syncAmountState);

document.querySelectorAll('.p2p-amount-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const amount = chip.dataset.amount || '0';
    if (amountInput) amountInput.value = amount;
    document.querySelectorAll('.p2p-amount-chip').forEach((item) => {
      item.classList.toggle('p2p-amount-chip--active', item === chip);
    });
    syncAmountState();
  });
});

sendBtn?.addEventListener('click', completeTransfer);
doneBtn?.addEventListener('click', goHome);
downloadBtn?.addEventListener('click', () => showToast('Confirmation downloaded'));

initPeerTransfer();
