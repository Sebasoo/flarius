const FlariusTransferAccount = (() => {
  function renderList(listEl, selectedCurrency, onSelect) {
    if (!listEl) return;

    const wallets = FlariusData.getWallets();

    listEl.innerHTML = FlariusData.getCurrencies()
      .map((currency) => {
        const balance = wallets[currency.code] ?? 0;
        const isActive = currency.code === selectedCurrency;
        return `
          <button class="xfer-sheet__option${isActive ? ' xfer-sheet__option--active' : ''}" type="button" data-currency="${currency.code}">
            <span class="xfer-sheet__flag" aria-hidden="true">${currency.flag}</span>
            <span class="xfer-sheet__info">
              <span class="xfer-sheet__name">${currency.name}</span>
              <span class="xfer-sheet__balance">${FlariusData.formatCurrencyAmount(balance, currency.code, { compact: true })} available</span>
            </span>
            <span class="xfer-sheet__check" aria-hidden="true">${isActive ? '✓' : ''}</span>
          </button>`;
      })
      .join('');

    listEl.querySelectorAll('[data-currency]').forEach((button) => {
      button.addEventListener('click', () => onSelect(button.dataset.currency));
    });
  }

  function mount(config) {
    const {
      triggerEl,
      flagEl,
      codeEl,
      nameEl,
      balanceEl,
      sheetEl,
      listEl,
      closeEl,
      onChange,
      initialCurrency,
    } = config;

    let currency = initialCurrency || FlariusData.getActiveCurrency();

    function updateTrigger() {
      const meta = FlariusData.getCurrencyMeta(currency);
      const balance = FlariusData.getWalletBalance(currency);

      if (flagEl) flagEl.textContent = meta.flag;
      if (codeEl) codeEl.textContent = meta.code;
      if (nameEl) nameEl.textContent = meta.name;
      if (balanceEl) {
        balanceEl.textContent = `Available ${FlariusData.formatCurrencyAmount(balance, currency)}`;
      }
    }

    function openSheet() {
      if (!sheetEl) return;
      renderList(listEl, currency, selectCurrency);
      sheetEl.classList.remove('xfer-sheet--hidden');
      sheetEl.setAttribute('aria-hidden', 'false');
    }

    function closeSheet() {
      if (!sheetEl) return;
      sheetEl.classList.add('xfer-sheet--hidden');
      sheetEl.setAttribute('aria-hidden', 'true');
    }

    function selectCurrency(nextCurrency) {
      if (!nextCurrency || !FlariusData.getCurrencyMeta(nextCurrency)) return;
      currency = nextCurrency;
      updateTrigger();
      closeSheet();
      onChange?.();
    }

    triggerEl?.addEventListener('click', openSheet);
    closeEl?.addEventListener('click', closeSheet);
    sheetEl?.addEventListener('click', (event) => {
      if (event.target === sheetEl) closeSheet();
    });

    updateTrigger();

    return {
      getCurrency: () => currency,
      getBalance: () => FlariusData.getWalletBalance(currency),
      refresh: updateTrigger,
      formatAmount: (amount) => FlariusData.formatBalance(amount, currency),
      setCurrency: selectCurrency,
      open: openSheet,
      close: closeSheet,
    };
  }

  return { mount };
})();
