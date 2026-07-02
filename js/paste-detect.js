const DEMO_TEXT = `Hey! 👋 To confirm your booking, please transfer 50% in advance within 48h:

🏨 Sunrise Hotel
IBAN: DE89 3704 0044 0532 0130 00
Ref: Stefan Manson + check-in date

Send us a screenshot once done and we'll confirm right away! ✅`;

const PARSING_STEPS = [
  { label: 'Reading document…', field: null, progress: 18 },
  { label: 'Detecting recipient…', field: 'name', progress: 42 },
  { label: 'Extracting IBAN…', field: 'account', progress: 68 },
  { label: 'Matching reference…', field: 'title', progress: 86 },
  { label: 'Almost done…', field: 'country', progress: 100 },
];

const stepInstruction = document.getElementById('pd-step-instruction');
const stepPaste = document.getElementById('pd-step-paste');
const stepDetails = document.getElementById('pd-step-details');
const stepSuccess = document.getElementById('pd-step-success');
const parsingOverlay = document.getElementById('pd-parsing');
const parsingStatus = document.getElementById('pd-parsing-status');
const parsingBar = document.getElementById('pd-parsing-bar');
const parsingFields = document.getElementById('pd-parsing-fields');
const navTitle = document.getElementById('pd-nav-title');
const backBtn = document.getElementById('pd-back');
const skipBtn = document.getElementById('pd-skip-btn');
const textarea = document.getElementById('pd-textarea');
const uploadBtn = document.getElementById('pd-upload-btn');
const pasteBtn = document.getElementById('pd-paste-btn');
const detectBtn = document.getElementById('pd-detect-btn');
const fileInput = document.getElementById('pd-file-input');
const continueBtn = document.getElementById('pd-continue-btn');
const footer = document.getElementById('pd-footer');
const successText = document.getElementById('pd-success-text');
const successSummary = document.getElementById('pd-success-summary');

const fields = {
  country: document.getElementById('pd-country'),
  account: document.getElementById('pd-account'),
  firstName: document.getElementById('pd-first-name'),
  lastName: document.getElementById('pd-last-name'),
  title: document.getElementById('pd-title'),
  amount: document.getElementById('pd-amount'),
};

let currentStep = 'instruction';
let parsedData = null;
let parsingTimers = [];
let payAccount = null;

function setStep(step) {
  currentStep = step;
  const steps = { instruction: stepInstruction, paste: stepPaste, details: stepDetails, success: stepSuccess };
  Object.entries(steps).forEach(([name, element]) => {
    element?.classList.toggle('pd-step--hidden', name !== step);
  });

  if (navTitle) {
    navTitle.textContent = step === 'details' ? 'Transfer details' : 'Paste & detect';
  }

  const showFooterContinue = step === 'details' || step === 'success';
  continueBtn?.classList.toggle('pd-continue-btn--hidden', !showFooterContinue);
  skipBtn?.classList.toggle('pd-skip-btn--hidden', step !== 'instruction');
  footer?.classList.toggle('pd-footer--success', step === 'success');

  if (continueBtn) {
    continueBtn.textContent = step === 'success' ? 'Back to Transfer' : 'Continue';
  }
}

function parsePaymentText(text) {
  const source = text || DEMO_TEXT;
  const ibanMatch = source.match(/IBAN:\s*([A-Z]{2}\d{2}[\s\d]+)/i);
  const iban = ibanMatch ? ibanMatch[1].replace(/\s+/g, ' ').trim() : 'DE89 3704 0044 0532 0130 00';
  const country = iban.trim().toUpperCase().startsWith('DE') ? 'Germany' : 'India';

  let firstName = 'Sunrise';
  let lastName = 'Hotel';
  if (/Sunrise\s+Hotel/i.test(source)) {
    firstName = 'Sunrise';
    lastName = 'Hotel';
  }

  const refMatch = source.match(/Ref:\s*([^+\n]+)/i);
  const title = refMatch ? refMatch[1].trim() : 'Stefan Manson';

  return {
    country,
    accountNumber: iban,
    firstName,
    lastName,
    title,
    amount: 50,
    recipientName: `${firstName} ${lastName}`,
  };
}

function syncDetectButton() {
  if (!detectBtn || !textarea) return;
  detectBtn.disabled = !textarea.value.trim();
}

function fillTextarea(value) {
  if (!textarea) return;
  textarea.value = value;
  syncDetectButton();
}

async function loadDemoInvoice() {
  try {
    const response = await fetch('../assets/demo-invoice.txt');
    if (!response.ok) throw new Error('fetch failed');
    fillTextarea(await response.text());
  } catch {
    fillTextarea(DEMO_TEXT);
  }
}

function applyParsedData(data) {
  parsedData = data;
  if (fields.country) fields.country.value = data.country;
  if (fields.account) fields.account.value = data.accountNumber;
  if (fields.firstName) fields.firstName.value = data.firstName;
  if (fields.lastName) fields.lastName.value = data.lastName;
  if (fields.title) fields.title.value = data.title;
  if (fields.amount) fields.amount.value = data.amount.toFixed(2);
  document.querySelectorAll('.pd-amount-chip').forEach((chip) => {
    chip.classList.toggle('pd-amount-chip--active', Number(chip.dataset.amount) === data.amount);
  });
}

function clearParsingTimers() {
  parsingTimers.forEach((timer) => clearTimeout(timer));
  parsingTimers = [];
}

function resetParsingUi() {
  parsingFields?.querySelectorAll('li').forEach((item) => item.classList.remove('pd-parsing__field--done'));
  if (parsingBar) parsingBar.style.width = '0%';
}

function runParsingAnimation(onComplete) {
  parsingOverlay?.classList.add('pd-parsing--visible');
  parsingOverlay?.setAttribute('aria-hidden', 'false');
  resetParsingUi();

  PARSING_STEPS.forEach((step, index) => {
    const timer = setTimeout(() => {
      if (parsingStatus) parsingStatus.textContent = step.label;
      if (parsingBar) parsingBar.style.width = `${step.progress}%`;
      if (step.field) {
        parsingFields?.querySelector(`[data-field="${step.field}"]`)?.classList.add('pd-parsing__field--done');
      }

      if (index === PARSING_STEPS.length - 1) {
        const finishTimer = setTimeout(() => {
          parsingOverlay?.classList.remove('pd-parsing--visible');
          parsingOverlay?.setAttribute('aria-hidden', 'true');
          onComplete();
        }, 500);
        parsingTimers.push(finishTimer);
      }
    }, index * 700);
    parsingTimers.push(timer);
  });
}

function startDetection() {
  const text = textarea?.value.trim();
  if (!text) return;

  const data = parsePaymentText(text);
  clearParsingTimers();
  runParsingAnimation(() => {
    applyParsedData(data);
    setStep('details');
  });
}

function renderSuccessSummary(data) {
  if (!successSummary || !data) return;
  successSummary.innerHTML = `
    <div class="pd-success__row"><span>To</span><strong>${data.recipientName}</strong></div>
    <div class="pd-success__row"><span>IBAN</span><strong>${data.accountNumber}</strong></div>
    <div class="pd-success__row"><span>Country</span><strong>${data.country}</strong></div>
    <div class="pd-success__row"><span>Amount</span><strong>${FlariusData.formatCurrencyAmount(Number(fields.amount?.value || data.amount), payAccount?.getCurrency() || FlariusData.getActiveCurrency())}</strong></div>
  `;
}

function completeFlow() {
  if (!parsedData) return;

  parsedData = {
    ...parsedData,
    amount: parseFloat(fields.amount?.value || '0') || parsedData.amount,
    title: fields.title?.value || parsedData.title,
    accountNumber: fields.account?.value || parsedData.accountNumber,
    country: fields.country?.value || parsedData.country,
    firstName: fields.firstName?.value || parsedData.firstName,
    lastName: fields.lastName?.value || parsedData.lastName,
    recipientName: `${fields.firstName?.value || ''} ${fields.lastName?.value || ''}`.trim(),
  };

  if (successText) {
    successText.textContent = 'Neo extracted all transfer fields from your text';
  }
  renderSuccessSummary(parsedData);
  setStep('success');
}

function goBack() {
  if (currentStep === 'instruction' || currentStep === 'paste') {
    window.location.href = 'transfer.html';
    return;
  }
  if (currentStep === 'details') {
    setStep('paste');
    return;
  }
  if (currentStep === 'success') {
    setStep('details');
  }
}

function initFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('step') === 'paste') {
    setStep('paste');
  }
}

skipBtn?.addEventListener('click', () => setStep('paste'));
backBtn?.addEventListener('click', goBack);

textarea?.addEventListener('input', syncDetectButton);

pasteBtn?.addEventListener('click', () => {
  fillTextarea(DEMO_TEXT);
  setTimeout(startDetection, 400);
});

uploadBtn?.addEventListener('click', () => fileInput?.click());

fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    fillTextarea(await file.text());
  } else {
    fillTextarea(DEMO_TEXT);
  }
  fileInput.value = '';
  setTimeout(startDetection, 400);
});

detectBtn?.addEventListener('click', startDetection);

document.querySelectorAll('.pd-amount-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const amount = chip.dataset.amount || '0';
    if (fields.amount) fields.amount.value = Number(amount).toFixed(2);
    document.querySelectorAll('.pd-amount-chip').forEach((item) => {
      item.classList.toggle('pd-amount-chip--active', item === chip);
    });
  });
});

continueBtn?.addEventListener('click', () => {
  if (currentStep === 'details') {
    completeFlow();
    return;
  }
  if (currentStep === 'success' && parsedData) {
    const amount = parseFloat(fields.amount?.value || String(parsedData.amount)) || parsedData.amount;
    const params = new URLSearchParams({
      contact: 'detected',
      amount: String(amount),
      currency: payAccount?.getCurrency() || FlariusData.getActiveCurrency(),
      name: parsedData.recipientName,
      subtitle: parsedData.accountNumber,
    });
    window.location.href = `transfer.html?${params.toString()}`;
  }
});

initFromQuery();
syncDetectButton();

payAccount = FlariusTransferAccount.mount({
  triggerEl: document.getElementById('pd-account-btn'),
  flagEl: document.getElementById('pd-account-flag'),
  codeEl: document.getElementById('pd-account-code'),
  balanceEl: document.getElementById('pd-account-balance'),
  sheetEl: document.getElementById('xfer-account-sheet'),
  listEl: document.getElementById('xfer-account-list'),
  closeEl: document.getElementById('xfer-account-close'),
});
