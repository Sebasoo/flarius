const overlay = document.getElementById('overlay');
const paySheet = document.getElementById('pay-sheet');
const myQrSheet = document.getElementById('my-qr-sheet');
const successSheet = document.getElementById('success-sheet');
const demoScanBtn = document.getElementById('demo-scan-btn');
const showQrBtn = document.getElementById('show-qr-btn');
const payBtn = document.getElementById('pay-btn');
const amountInput = document.getElementById('amount');
const flashBtn = document.getElementById('flash-btn');
const qrViewport = document.getElementById('qr-viewport');
const toast = document.getElementById('toast');
const successText = document.getElementById('success-text');
const successDoneBtn = document.getElementById('success-done-btn');

let activeSheet = null;
let toastTimer;
let lastPayment = null;

function openSheet(sheet) {
  activeSheet = sheet;
  overlay?.classList.add('overlay--visible');
  sheet?.classList.add('sheet--visible');
}

function closeSheets() {
  activeSheet = null;
  overlay?.classList.remove('overlay--visible');
  [paySheet, myQrSheet, successSheet].forEach((sheet) => {
    sheet?.classList.remove('sheet--visible');
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function formatAmount(value) {
  const numeric = value.replace(/[^\d.]/g, '');
  if (!numeric) return '0.00 ₹';
  const parts = numeric.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '00').slice(0, 2).padEnd(2, '0');
  return `${whole}.${fraction} ₹`;
}

function syncPayButton() {
  if (!amountInput || !payBtn) return;
  const formatted = formatAmount(amountInput.value);
  amountInput.value = formatted;
  payBtn.textContent = `Pay ${formatted}`;
}

function completePayment() {
  const amountValue = FlariusData.parseAmount(amountInput?.value || '0');
  if (!amountValue) return;

  const merchant = 'Blue Tokai Coffee';
  lastPayment = {
    title: merchant,
    amount: amountValue,
    date: new Date().toISOString(),
    avatar: 'emoji',
    avatarEmoji: '☕',
  };

  FlariusData.applyPayment(lastPayment);
  FlariusData.rememberPendingPayment(lastPayment);

  if (successText) {
    successText.textContent = `${formatAmount(String(amountValue))} sent to ${merchant}`;
  }
  paySheet?.classList.remove('sheet--visible');
  openSheet(successSheet);
}

demoScanBtn?.addEventListener('click', () => {
  showToast('QR code recognized');
  setTimeout(() => openSheet(paySheet), 500);
});

showQrBtn?.addEventListener('click', () => openSheet(myQrSheet));

qrViewport?.addEventListener('click', () => {
  demoScanBtn?.click();
});

flashBtn?.addEventListener('click', () => {
  flashBtn.classList.toggle('qr-topbar__flash--on');
  showToast(flashBtn.classList.contains('qr-topbar__flash--on') ? 'Flashlight on' : 'Flashlight off');
});

overlay?.addEventListener('click', closeSheets);

amountInput?.addEventListener('input', syncPayButton);
amountInput?.addEventListener('blur', syncPayButton);

payBtn?.addEventListener('click', completePayment);

function goHomeAfterPayment() {
  if (!lastPayment) {
    window.location.href = '../index.html';
    return;
  }

  const params = new URLSearchParams({
    paid: '1',
    title: lastPayment.title,
    amount: String(lastPayment.amount),
    date: lastPayment.date,
    emoji: lastPayment.avatarEmoji || '☕',
  });

  window.location.href = `../index.html?${params.toString()}`;
}

successDoneBtn?.addEventListener('click', (event) => {
  event.preventDefault();
  goHomeAfterPayment();
});

syncPayButton();
