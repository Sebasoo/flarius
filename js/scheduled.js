const backBtn = document.getElementById('scheduled-back');
const titleEl = document.getElementById('scheduled-title');
const addBtn = document.getElementById('scheduled-add');
const stepList = document.getElementById('scheduled-step-list');
const stepRecipient = document.getElementById('scheduled-step-recipient');
const stepDetails = document.getElementById('scheduled-step-details');
const stepReview = document.getElementById('scheduled-step-review');
const stepSuccess = document.getElementById('scheduled-step-success');
const listEl = document.getElementById('scheduled-list');
const recipientsEl = document.getElementById('scheduled-recipients');
const recipientAvatar = document.getElementById('scheduled-recipient-avatar');
const recipientName = document.getElementById('scheduled-recipient-name');
const recipientSubtitle = document.getElementById('scheduled-recipient-subtitle');
const amountInput = document.getElementById('scheduled-amount');
const frequencySelect = document.getElementById('scheduled-frequency');
const dateInput = document.getElementById('scheduled-date');
const noteInput = document.getElementById('scheduled-note');
const reviewEl = document.getElementById('scheduled-review');
const successText = document.getElementById('scheduled-success-text');
const toast = document.getElementById('toast');

let currentStep = 'list';
let scheduledItems = [];
let selectedRecipient = null;
let draft = null;
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function setStep(step) {
  currentStep = step;
  const steps = {
    list: stepList,
    recipient: stepRecipient,
    details: stepDetails,
    review: stepReview,
    success: stepSuccess,
  };
  Object.entries(steps).forEach(([name, element]) => {
    element?.classList.toggle('scheduled-step--hidden', name !== step);
  });

  const titles = {
    list: 'Scheduled',
    recipient: 'New transfer',
    details: 'Set schedule',
    review: 'Review',
    success: '',
  };
  if (titleEl) titleEl.textContent = titles[step] || 'Scheduled';
  titleEl?.classList.toggle('p2p-nav__title--hidden', step === 'success');
  backBtn?.classList.toggle('p2p-nav__back--hidden', step === 'success');
  addBtn?.classList.toggle('p2p-nav__add--hidden', step !== 'list');
}

function getRecipientOptions() {
  const friends = FlariusData.getFriends();
  const contacts = FlariusData.getTransferContacts();
  const merged = [...friends, ...contacts];
  const seen = new Set();
  return merged.filter((item) => {
    const key = item.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderScheduledList() {
  if (!listEl) return;

  if (!scheduledItems.length) {
    listEl.innerHTML = `
      <div class="scheduled-empty">
        <p>No scheduled transfers yet</p>
        <button class="cards-empty__btn" type="button" id="scheduled-empty-add">Schedule a transfer</button>
      </div>
    `;
    document.getElementById('scheduled-empty-add')?.addEventListener('click', startNewScheduled);
    return;
  }

  listEl.innerHTML = scheduledItems
    .map(
      (item) => `
      <article class="scheduled-card">
        <div class="scheduled-card__main">
          ${FlariusUI.renderAvatar({
            type: item.avatar,
            name: item.recipient,
            initials: item.initials,
            assetPrefix: '../assets/',
            size: 'sm',
          })}
          <div class="scheduled-card__info">
            <strong>${item.recipient}</strong>
            <span>${item.subtitle}</span>
          </div>
        </div>
        <div class="scheduled-card__meta">
          <strong>${FlariusData.formatCurrencyAmount(item.amount, item.currency || FlariusData.getActiveCurrency())}</strong>
          <span>${item.frequency} · Next ${FlariusData.formatScheduledDate(item.nextDate)}</span>
        </div>
      </article>`
    )
    .join('');
}

function renderRecipientOptions() {
  if (!recipientsEl) return;
  const options = getRecipientOptions();

  recipientsEl.innerHTML = options
    .map(
      (item) => `
      <button class="p2p-peer-row" type="button" data-recipient-id="${item.id}">
        ${FlariusUI.renderAvatar({
          type: item.avatar,
          name: item.name,
          initials: item.initials,
          assetPrefix: '../assets/',
          size: 'sm',
        })}
        <span class="p2p-peer-row__info">
          <span class="p2p-peer-row__name">${item.name}</span>
          <span class="p2p-peer-row__tag">${item.flaTag ? `@${item.flaTag}` : item.subtitle || ''}</span>
        </span>
      </button>`
    )
    .join('');
}

function updateRecipientCard(recipient) {
  if (!recipient) return;
  if (recipientAvatar) {
    recipientAvatar.innerHTML = FlariusUI.renderAvatar({
      type: recipient.avatar,
      name: recipient.name,
      initials: recipient.initials,
      assetPrefix: '../assets/',
    });
  }
  if (recipientName) recipientName.textContent = recipient.name;
  if (recipientSubtitle) {
    recipientSubtitle.textContent = recipient.flaTag ? `@${recipient.flaTag}` : recipient.subtitle || '';
  }
}

function startNewScheduled() {
  selectedRecipient = null;
  draft = null;
  if (amountInput) amountInput.value = '';
  if (noteInput) noteInput.value = '';
  if (frequencySelect) frequencySelect.value = 'Monthly';
  if (dateInput) {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    dateInput.value = next.toISOString().slice(0, 10);
  }
  renderRecipientOptions();
  setStep('recipient');
}

function selectRecipient(recipient) {
  selectedRecipient = recipient;
  updateRecipientCard(recipient);
  setStep('details');
}

function buildDraft() {
  const amount = FlariusData.parseAmount(amountInput?.value || '0');
  if (!selectedRecipient || !amount) return null;

  return {
    id: `sched-${Date.now()}`,
    recipient: selectedRecipient.name,
    subtitle: selectedRecipient.flaTag ? `@${selectedRecipient.flaTag}` : selectedRecipient.subtitle || 'Transfer',
    amount,
    currency: FlariusData.getActiveCurrency(),
    frequency: frequencySelect?.value || 'Monthly',
    nextDate: dateInput?.value || new Date().toISOString().slice(0, 10),
    note: noteInput?.value.trim() || '',
    initials: selectedRecipient.initials || FlariusUI.getInitials(selectedRecipient.name),
    avatar: selectedRecipient.avatar || 'initials',
    status: 'active',
  };
}

function openReview() {
  draft = buildDraft();
  if (!draft) {
    showToast('Enter a valid amount');
    return;
  }

  if (!reviewEl) return;
  reviewEl.innerHTML = `
    <div class="scheduled-review__row"><span>To</span><strong>${draft.recipient}</strong></div>
    <div class="scheduled-review__row"><span>Amount</span><strong>${FlariusData.formatCurrencyAmount(draft.amount, draft.currency)}</strong></div>
    <div class="scheduled-review__row"><span>Frequency</span><strong>${draft.frequency}</strong></div>
    <div class="scheduled-review__row"><span>Starts</span><strong>${FlariusData.formatScheduledDate(draft.nextDate)}</strong></div>
    ${draft.note ? `<div class="scheduled-review__row"><span>Reference</span><strong>${draft.note}</strong></div>` : ''}
  `;
  setStep('review');
}

function confirmScheduled() {
  if (!draft) return;
  FlariusData.addScheduledPayment(draft);
  scheduledItems = FlariusData.getScheduledPayments();
  if (successText) {
    successText.textContent = `${FlariusData.formatCurrencyAmount(draft.amount, draft.currency)} to ${draft.recipient} scheduled ${draft.frequency.toLowerCase()}.`;
  }
  setStep('success');
}

function goBack() {
  if (currentStep === 'list') {
    window.location.href = 'transfer.html';
    return;
  }
  if (currentStep === 'recipient') {
    setStep('list');
    return;
  }
  if (currentStep === 'details') {
    setStep('recipient');
    return;
  }
  if (currentStep === 'review') {
    setStep('details');
  }
}

function initScheduled() {
  FlariusData.ensureDefaults();
  scheduledItems = FlariusData.getScheduledPayments();
  renderScheduledList();

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'new') {
    startNewScheduled();
    try {
      window.history.replaceState({}, '', 'scheduled.html');
    } catch {
      // ignore
    }
  } else {
    setStep('list');
  }
}

recipientsEl?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-recipient-id]');
  if (!button) return;
  const options = getRecipientOptions();
  const recipient = options.find((item) => item.id === button.dataset.recipientId);
  if (recipient) selectRecipient(recipient);
});

backBtn?.addEventListener('click', goBack);
addBtn?.addEventListener('click', startNewScheduled);
document.getElementById('scheduled-change-recipient')?.addEventListener('click', () => setStep('recipient'));
document.getElementById('scheduled-review-btn')?.addEventListener('click', openReview);
document.getElementById('scheduled-confirm-btn')?.addEventListener('click', confirmScheduled);
document.getElementById('scheduled-done-btn')?.addEventListener('click', () => {
  window.location.href = 'transfer.html';
});

initScheduled();
