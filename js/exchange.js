const sellAmountInput = document.getElementById('ex-sell-amount');
const buyAmountInput = document.getElementById('ex-buy-amount');
const sellBalanceEl = document.getElementById('ex-sell-balance');
const buyHintEl = document.getElementById('ex-buy-hint');
const rateEl = document.getElementById('ex-rate');
const submitBtn = document.getElementById('ex-submit');
const swapBtn = document.getElementById('ex-swap');
const useMaxBtn = document.getElementById('ex-use-max');
const sellFlag = document.getElementById('ex-sell-flag');
const sellCode = document.getElementById('ex-sell-code');
const buyFlag = document.getElementById('ex-buy-flag');
const buyCode = document.getElementById('ex-buy-code');
const currencySheet = document.getElementById('ex-currency-sheet');
const currencySheetTitle = document.getElementById('ex-currency-sheet-title');
const currencyList = document.getElementById('ex-currency-list');
const currencyClose = document.getElementById('ex-currency-close');
const mainView = document.getElementById('ex-main');
const successView = document.getElementById('ex-success');
const successText = document.getElementById('ex-success-text');
const toast = document.getElementById('toast');

let sellCurrency = 'EUR';
let buyCurrency = 'USD';
let activePicker = null;
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function updateCurrencyButtons() {
  const sellMeta = FlariusData.getCurrencyMeta(sellCurrency);
  const buyMeta = FlariusData.getCurrencyMeta(buyCurrency);
  if (sellFlag) sellFlag.textContent = sellMeta.flag;
  if (sellCode) sellCode.textContent = sellMeta.code;
  if (buyFlag) buyFlag.textContent = buyMeta.flag;
  if (buyCode) buyCode.textContent = buyMeta.code;
}

function getSellAmount() {
  return FlariusData.parseAmount(sellAmountInput?.value || '0');
}

function syncExchange() {
  const sellAmount = getSellAmount();
  const available = FlariusData.getWalletBalance(sellCurrency);
  const buyAmount = sellAmount > 0 ? FlariusData.convertAmount(sellAmount, sellCurrency, buyCurrency) : 0;

  if (buyAmountInput) {
    buyAmountInput.value = buyAmount > 0 ? buyAmount.toFixed(2) : '0.00';
  }
  if (sellBalanceEl) {
    sellBalanceEl.textContent = `Available ${FlariusData.formatCurrencyAmount(available, sellCurrency)}`;
    sellBalanceEl.classList.toggle('ex-panel__balance--error', sellAmount > available);
  }
  if (buyHintEl) {
    buyHintEl.textContent = buyAmount > 0 ? 'Estimated amount' : 'Enter an amount to exchange';
  }
  if (rateEl) {
    rateEl.textContent = FlariusData.formatExchangeRate(sellCurrency, buyCurrency);
  }
  if (submitBtn) {
    submitBtn.disabled = !sellAmount || sellAmount > available || sellCurrency === buyCurrency;
  }
}

function openCurrencyPicker(side) {
  activePicker = side;
  if (!currencySheet || !currencyList) return;

  currencySheetTitle.textContent = side === 'sell' ? 'You sell' : 'You get';
  const current = side === 'sell' ? sellCurrency : buyCurrency;
  const other = side === 'sell' ? buyCurrency : sellCurrency;
  const wallets = FlariusData.getWallets();

  currencyList.innerHTML = FlariusData.getCurrencies()
    .map((currency) => {
      const balance = wallets[currency.code] ?? 0;
      const disabled = currency.code === other;
      return `
        <button class="ex-currency-option${currency.code === current ? ' ex-currency-option--active' : ''}${disabled ? ' ex-currency-option--disabled' : ''}" type="button" data-currency="${currency.code}" ${disabled ? 'disabled' : ''}>
          <span class="ex-currency-option__flag">${currency.flag}</span>
          <span class="ex-currency-option__info">
            <span class="ex-currency-option__code">${currency.code}</span>
            <span class="ex-currency-option__name">${currency.name}</span>
          </span>
          <span class="ex-currency-option__balance">${FlariusData.formatCurrencyAmount(balance, currency.code, { compact: true })}</span>
        </button>`;
    })
    .join('');

  currencySheet.classList.remove('ex-currency-sheet--hidden');
  currencySheet.setAttribute('aria-hidden', 'false');
}

function closeCurrencyPicker() {
  activePicker = null;
  currencySheet?.classList.add('ex-currency-sheet--hidden');
  currencySheet?.setAttribute('aria-hidden', 'true');
}

function selectCurrency(code) {
  if (!activePicker) return;

  if (activePicker === 'sell') {
    sellCurrency = code;
    if (sellCurrency === buyCurrency) {
      buyCurrency = FlariusData.getCurrencies().find((item) => item.code !== sellCurrency)?.code || 'USD';
    }
  } else {
    buyCurrency = code;
    if (buyCurrency === sellCurrency) {
      sellCurrency = FlariusData.getCurrencies().find((item) => item.code !== buyCurrency)?.code || 'EUR';
    }
  }

  updateCurrencyButtons();
  closeCurrencyPicker();
  syncExchange();
}

function swapCurrencies() {
  const previousSell = sellCurrency;
  sellCurrency = buyCurrency;
  buyCurrency = previousSell;

  const currentSellAmount = getSellAmount();
  const convertedSell = currentSellAmount > 0
    ? FlariusData.convertAmount(currentSellAmount, previousSell, sellCurrency)
    : 0;

  if (sellAmountInput) {
    sellAmountInput.value = convertedSell > 0 ? String(convertedSell) : '0';
  }

  updateCurrencyButtons();
  syncExchange();

  swapBtn?.classList.add('ex-swap--spin');
  setTimeout(() => swapBtn?.classList.remove('ex-swap--spin'), 320);
}

function useMaxBalance() {
  const available = FlariusData.getWalletBalance(sellCurrency);
  if (sellAmountInput) sellAmountInput.value = String(available);
  syncExchange();
}

function completeExchange() {
  const sellAmount = getSellAmount();
  const buyAmount = FlariusData.parseAmount(buyAmountInput?.value || '0');
  if (!sellAmount || sellCurrency === buyCurrency) return;

  const applied = FlariusData.applyExchange({
    from: sellCurrency,
    to: buyCurrency,
    fromAmount: sellAmount,
    toAmount: buyAmount,
  });

  if (!applied) {
    showToast('Unable to complete exchange');
    return;
  }

  if (successText) {
    successText.textContent = `You exchanged ${FlariusData.formatCurrencyAmount(sellAmount, sellCurrency)} for ${FlariusData.formatCurrencyAmount(buyAmount, buyCurrency)}`;
  }

  mainView?.classList.add('ex-page--hidden');
  successView?.classList.remove('ex-success--hidden');
}

function initExchange() {
  FlariusData.ensureDefaults();
  sellCurrency = FlariusData.getActiveCurrency();
  buyCurrency = FlariusData.getCurrencies().find((item) => item.code !== sellCurrency)?.code || 'USD';
  updateCurrencyButtons();
  syncExchange();
}

sellAmountInput?.addEventListener('input', () => {
  const raw = sellAmountInput.value.replace(/[^\d.]/g, '');
  if (/^\d*\.?\d{0,2}$/.test(raw)) {
    sellAmountInput.value = raw;
  }
  syncExchange();
});

document.querySelectorAll('[data-picker]').forEach((button) => {
  button.addEventListener('click', () => openCurrencyPicker(button.dataset.picker));
});

currencyList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-currency]');
  if (!button || button.disabled) return;
  selectCurrency(button.dataset.currency);
});

currencyClose?.addEventListener('click', closeCurrencyPicker);
swapBtn?.addEventListener('click', swapCurrencies);
useMaxBtn?.addEventListener('click', useMaxBalance);
submitBtn?.addEventListener('click', completeExchange);

initExchange();
