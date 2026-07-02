const backBtn = document.getElementById('add-friend-back');
const titleEl = document.getElementById('add-friend-title');
const stepMenu = document.getElementById('add-friend-step-menu');
const stepInput = document.getElementById('add-friend-step-input');
const stepQr = document.getElementById('add-friend-step-qr');
const stepResult = document.getElementById('add-friend-step-result');
const contactSegment = document.getElementById('contact-segment');
const nameInput = document.getElementById('add-contact-name');
const inputLabel = document.getElementById('add-friend-input-label');
const inputField = document.getElementById('add-friend-input');
const inputHint = document.getElementById('add-friend-input-hint');
const searchBtn = document.getElementById('add-friend-search-btn');
const resultEl = document.getElementById('add-friend-result');
const confirmBtn = document.getElementById('add-friend-confirm-btn');
const demoScanBtn = document.getElementById('add-friend-demo-scan');
const toast = document.getElementById('toast');

const METHOD_COPY = {
  'fla-tag': {
    label: 'FlaTag',
    placeholder: '@username',
    hint: 'Enter the FlaTag without spaces.',
    inputMode: 'text',
  },
  phone: {
    label: 'Phone number',
    placeholder: '+44 7700 900123',
    hint: 'Include country code for best results.',
    inputMode: 'tel',
  },
  email: {
    label: 'Email address',
    placeholder: 'name@example.com',
    hint: 'Use the email linked to their Flarius account.',
    inputMode: 'email',
  },
};

let currentStep = 'menu';
let activeMethod = null;
let contactMode = 'phone';
let foundFriend = null;
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
  const steps = { menu: stepMenu, input: stepInput, qr: stepQr, result: stepResult };
  Object.entries(steps).forEach(([name, element]) => {
    element?.classList.toggle('add-friend-step--hidden', name !== step);
  });

  if (titleEl) {
    if (step === 'menu') titleEl.textContent = 'Add contact';
    else if (step === 'qr') titleEl.textContent = 'Scan QR code';
    else if (step === 'result') titleEl.textContent = 'Found on Flarius';
    else titleEl.textContent = 'Add contact';
  }
}

function updateContactMode(mode) {
  contactMode = mode;
  const copy = METHOD_COPY[mode];
  if (!copy) return;

  contactSegment?.querySelectorAll('[data-contact-mode]').forEach((button) => {
    button.classList.toggle('contact-segment__btn--active', button.dataset.contactMode === mode);
  });

  if (inputLabel) inputLabel.textContent = copy.label;
  if (inputHint) inputHint.textContent = copy.hint;
  if (inputField) {
    inputField.placeholder = copy.placeholder;
    inputField.inputMode = copy.inputMode;
    inputField.type = mode === 'email' ? 'email' : 'text';
  }
}

function openMethod(method) {
  activeMethod = method;
  foundFriend = null;

  if (method === 'flarius') {
    window.location.href = 'peer-transfer.html';
    return;
  }

  if (method === 'qr') {
    setStep('qr');
    return;
  }

  if (nameInput) nameInput.value = '';
  if (inputField) inputField.value = '';

  if (method === 'contact') {
    contactSegment?.removeAttribute('hidden');
    updateContactMode('phone');
    setStep('input');
    nameInput?.focus();
    return;
  }

  contactSegment?.setAttribute('hidden', 'true');
  const copy = METHOD_COPY[method];
  if (!copy) return;

  if (inputLabel) inputLabel.textContent = copy.label;
  if (inputHint) inputHint.textContent = copy.hint;
  if (inputField) {
    inputField.placeholder = copy.placeholder;
    inputField.inputMode = copy.inputMode;
    inputField.type = 'text';
  }

  setStep('input');
  nameInput?.focus();
}

function renderFoundFriend(friend) {
  if (!resultEl) return;
  const displayName = nameInput?.value.trim() || friend.name;

  resultEl.innerHTML = `
    <div class="add-friend-result__card">
      ${FlariusUI.renderAvatar({
        type: friend.avatar,
        name: displayName,
        initials: friend.initials,
        assetPrefix: '../assets/',
      })}
      <div class="add-friend-result__info">
        <strong>${displayName}</strong>
        <span>@${friend.flaTag}</span>
      </div>
    </div>
  `;
}

function searchFriend() {
  const contactName = nameInput?.value.trim() || '';
  const value = inputField?.value.trim() || '';

  if (!contactName) {
    showToast('Enter contact name');
    return;
  }
  if (!value) {
    showToast('Enter contact details');
    return;
  }

  const lookupMethod = activeMethod === 'contact' ? contactMode : activeMethod;
  const friend = FlariusData.lookupFlariusUser(lookupMethod, value);
  if (!friend) {
    showToast('No Flarius user found');
    return;
  }

  foundFriend = { ...friend, displayName: contactName };
  renderFoundFriend(foundFriend);
  setStep('result');
}

function confirmFriend() {
  if (!foundFriend) return;

  const saved = {
    ...foundFriend,
    name: foundFriend.displayName || foundFriend.name,
  };
  FlariusData.addFriend(saved);
  showToast(`${saved.name} added`);
  window.setTimeout(() => {
    window.location.href = `peer-transfer.html?peer=${encodeURIComponent(saved.id)}`;
  }, 500);
}

function demoScanFriend() {
  if (nameInput) nameInput.value = 'Maria Lopez';
  foundFriend = FlariusData.lookupFlariusUser('fla-tag', 'marialopez');
  if (!foundFriend) return;
  foundFriend = { ...foundFriend, displayName: 'Maria Lopez' };
  renderFoundFriend(foundFriend);
  setStep('result');
}

function goBack() {
  if (currentStep === 'menu') {
    window.location.href = 'transfer.html';
    return;
  }
  setStep('menu');
}

document.querySelectorAll('[data-method]').forEach((button) => {
  button.addEventListener('click', () => openMethod(button.dataset.method));
});

contactSegment?.querySelectorAll('[data-contact-mode]').forEach((button) => {
  button.addEventListener('click', () => updateContactMode(button.dataset.contactMode));
});

backBtn?.addEventListener('click', goBack);
searchBtn?.addEventListener('click', searchFriend);
confirmBtn?.addEventListener('click', confirmFriend);
demoScanBtn?.addEventListener('click', demoScanFriend);

inputField?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') searchFriend();
});

setStep('menu');
