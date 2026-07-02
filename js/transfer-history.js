const historyList = document.getElementById('transfer-history-list');
const searchInput = document.getElementById('transfer-history-search');
const toast = document.getElementById('toast');

let historyItems = [];
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function formatPreviewAmount(amount) {
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

function renderHistoryList(query = '') {
  if (!historyList) return;

  const filtered = getFilteredHistory(query);
  if (!filtered.length) {
    historyList.innerHTML = '<p class="transfer-empty">No transfers found</p>';
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
            ${formatPreviewAmount(item.amount)}
          </span>
        </span>
        <span class="transfer-recipient-row__date">${FlariusData.formatTransferHistoryDate(item.date)}</span>
      </button>`
    )
    .join('');

  FlariusUI.staggerChildren(historyList, '.transfer-recipient-row');
}

function findContactForTransfer(item) {
  const contacts = FlariusData.getTransferContacts();
  const contact = contacts.find((entry) => entry.name === item.title);
  if (contact) return { type: 'transfer', id: contact.id };

  const peer = FlariusData.getP2pPeers().find((entry) => entry.name === item.title);
  if (peer) return { type: 'peer', id: peer.id };

  return null;
}

function openTransferForItem(item) {
  const match = findContactForTransfer(item);
  if (match?.type === 'peer') {
    window.location.href = `peer-transfer.html?peer=${match.id}`;
    return;
  }
  if (match?.type === 'transfer') {
    window.location.href = `transfer.html?contact=${match.id}`;
    return;
  }

  const params = new URLSearchParams({
    contact: 'history',
    name: item.title,
    amount: String(Math.abs(item.amount)),
  });
  if (item.initials) params.set('initials', item.initials);
  if (item.avatarSrc) params.set('avatarSrc', item.avatarSrc);
  if (item.avatarAlt) params.set('avatarAlt', item.avatarAlt);
  window.location.href = `transfer.html?${params.toString()}`;
}

function initTransferHistory() {
  FlariusData.ensureDefaults();
  historyItems = FlariusData.getTransferHistory();
  renderHistoryList();
}

historyList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-history-id]');
  if (!button) return;

  const item = historyItems.find((entry) => entry.id === button.dataset.historyId);
  if (item) openTransferForItem(item);
});

searchInput?.addEventListener('input', () => {
  renderHistoryList(searchInput.value);
});

initTransferHistory();
