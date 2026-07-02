const toast = document.getElementById('toast');
const overlay = document.getElementById('overlay');
const accountSheet = document.getElementById('account-sheet');
const profileSheet = document.getElementById('profile-sheet');
const myIdSheet = document.getElementById('my-id-sheet');
const accountLabel = document.getElementById('account-label');
const profileAccountLabel = document.getElementById('profile-account-label');
const accountOptions = document.getElementById('account-options');
const transactionList = document.getElementById('transaction-list');
const balanceAmount = document.getElementById('balance-amount');

let toastTimer;
let activeSheet = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function openSheet(sheet) {
  activeSheet = sheet;
  overlay?.classList.add('overlay--visible');
  accountSheet?.classList.remove('sheet--visible');
  profileSheet?.classList.remove('sheet--visible');
  myIdSheet?.classList.remove('sheet--visible');
  sheet?.classList.add('sheet--visible');

  if (sheet === accountSheet) {
    FlariusData.renderAccountOptions(accountOptions);
  }

  if (sheet === myIdSheet) {
    const user = typeof FlariusAuth !== 'undefined' ? FlariusAuth.getUser() : null;
    const tag = user?.flaTag || 'robert';
    const tagEl = document.getElementById('my-id-tag');
    if (tagEl) tagEl.textContent = `@${tag}`;
  }
}

function closeSheets() {
  activeSheet = null;
  overlay?.classList.remove('overlay--visible');
  accountSheet?.classList.remove('sheet--visible');
  profileSheet?.classList.remove('sheet--visible');
  myIdSheet?.classList.remove('sheet--visible');
}

function refreshAccountLabels() {
  const label = FlariusData.formatAccountLabel();
  if (accountLabel) accountLabel.textContent = label;
  if (profileAccountLabel) profileAccountLabel.textContent = label;

  const profileTitle = document.getElementById('profile-title');
  const profileFlaTag = document.getElementById('profile-fla-tag');
  if (profileTitle && typeof FlariusAuth !== 'undefined') {
    profileTitle.textContent = FlariusAuth.getFullName();
    const user = FlariusAuth.getUser();
    if (profileFlaTag) profileFlaTag.textContent = `@${user.flaTag || 'robert'}`;
  }
}

function refreshHomeDisplay() {
  FlariusData.renderBalance(balanceAmount);
  refreshAccountLabels();
  FlariusData.renderTransactionList(transactionList, 5, 'assets/');
}

function initHome() {
  const { paymentApplied, transferApplied } = FlariusData.bootstrapHome();
  refreshHomeDisplay();

  if (paymentApplied) {
    showToast('Payment added to history');
  } else if (transferApplied) {
    showToast('Transfer added to history');
  }
}

document.querySelectorAll('[data-action]').forEach((el) => {
  el.addEventListener('click', () => {
    const action = el.dataset.action;
    switch (action) {
      case 'account-switcher':
        openSheet(accountSheet);
        break;
      case 'profile':
        openSheet(profileSheet);
        break;
      case 'my-id':
        openSheet(myIdSheet);
        break;
      case 'more':
        showToast('More actions — coming soon');
        break;
      case 'reset-demo':
        FlariusData.resetDemo();
        refreshHomeDisplay();
        closeSheets();
        showToast('Demo cleared');
        window.setTimeout(() => {
          window.location.href = 'screens/auth.html';
        }, 600);
        break;
      default:
        break;
    }
  });
});

overlay?.addEventListener('click', closeSheets);

accountOptions?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-currency]');
  if (!button) return;

  FlariusData.setActiveCurrency(button.dataset.currency);
  refreshHomeDisplay();
  closeSheets();
});

initHome();

window.addEventListener('pageshow', () => {
  refreshHomeDisplay();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshHomeDisplay();
  }
});
