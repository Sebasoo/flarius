const scrollEl = document.getElementById('sa-scroll');
const chatEl = document.getElementById('sa-chat');
const promptsList = document.getElementById('sa-prompts-list');
const insightsEl = document.getElementById('sa-insights');
const greetingEl = document.getElementById('sa-greeting');
const balanceAmountEl = document.getElementById('sa-balance-amount');
const inputEl = document.getElementById('sa-input');
const sendBtn = document.getElementById('sa-send-btn');
const welcomeEl = document.getElementById('sa-welcome');

let isThinking = false;

function formatEuro(value) {
  return `€${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function scrollToBottom() {
  if (!scrollEl) return;
  scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
}

function renderInsights() {
  if (!insightsEl) return;

  insightsEl.innerHTML = mockFinancialData.insights
    .map(
      (insight) => `
      <article class="sa-insight sa-insight--${insight.tone}">
        <span class="sa-insight__dot" aria-hidden="true"></span>
        <span class="sa-insight__text">${insight.label}</span>
      </article>`
    )
    .join('');
}

function renderPrompts() {
  if (!promptsList) return;

  promptsList.innerHTML = getSuggestedPrompts()
    .map(
      (prompt) => `
      <button class="sa-prompt" type="button" data-prompt="${prompt.replace(/"/g, '&quot;')}">${prompt}</button>`
    )
    .join('');
}

function renderUserMessage(text) {
  return `
    <div class="sa-message sa-message--user">
      <div class="sa-message__bubble sa-message__bubble--user">${escapeHtml(text)}</div>
    </div>`;
}

function renderAssistantMessage(response) {
  const highlights = (response.highlights || [])
    .map(
      (item) => `
      <div class="sa-highlight">
        <span class="sa-highlight__label">${escapeHtml(item.label)}</span>
        <strong class="sa-highlight__value">${escapeHtml(item.value)}</strong>
      </div>`
    )
    .join('');

  return `
    <div class="sa-message sa-message--assistant">
      <div class="sa-message__avatar" aria-hidden="true">
        <img src="../assets/assistant-icon.svg" width="18" height="18" alt="">
      </div>
      <div class="sa-message__content">
        <div class="sa-message__bubble sa-message__bubble--assistant">
          <h3 class="sa-response__title">${escapeHtml(response.title)}</h3>
          <p class="sa-response__text">${escapeHtml(response.message)}</p>
          ${highlights ? `<div class="sa-highlights">${highlights}</div>` : ''}
          ${
            response.recommendation
              ? `<div class="sa-recommendation">
                  <span class="sa-recommendation__label">Recommendation</span>
                  <p class="sa-recommendation__text">${escapeHtml(response.recommendation)}</p>
                </div>`
              : ''
          }
        </div>
      </div>
    </div>`;
}

function renderTypingIndicator() {
  return `
    <div class="sa-message sa-message--assistant" id="sa-typing">
      <div class="sa-message__avatar" aria-hidden="true">
        <img src="../assets/assistant-icon.svg" width="18" height="18" alt="">
      </div>
      <div class="sa-message__content">
        <div class="sa-message__bubble sa-message__bubble--typing">
          <span class="sa-typing__text">Smart Assistant is analyzing</span>
          <span class="sa-typing__dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        </div>
      </div>
    </div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setComposerDisabled(disabled) {
  isThinking = disabled;
  if (inputEl) inputEl.disabled = disabled;
  if (sendBtn) sendBtn.disabled = disabled;
  promptsList?.querySelectorAll('.sa-prompt').forEach((button) => {
    button.disabled = disabled;
  });
}

function handleUserMessage(text) {
  const trimmed = text.trim();
  if (!trimmed || isThinking) return;

  if (welcomeEl) welcomeEl.classList.add('sa-welcome--compact');
  chatEl?.insertAdjacentHTML('beforeend', renderUserMessage(trimmed));
  scrollToBottom();

  setComposerDisabled(true);
  chatEl?.insertAdjacentHTML('beforeend', renderTypingIndicator());
  scrollToBottom();

  const delay = 800 + Math.floor(Math.random() * 700);
  const response = getAssistantResponse(trimmed);

  setTimeout(() => {
    document.getElementById('sa-typing')?.remove();
    chatEl?.insertAdjacentHTML('beforeend', renderAssistantMessage(response));
    setComposerDisabled(false);
    scrollToBottom();
    inputEl?.focus();
  }, delay);
}

function initSmartAssistant() {
  if (greetingEl) {
    greetingEl.textContent = `Hi ${mockFinancialData.userName} 👋`;
  }
  if (balanceAmountEl) {
    balanceAmountEl.textContent = formatEuro(mockFinancialData.balance);
  }

  renderInsights();
  renderPrompts();

  promptsList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-prompt]');
    if (!button || button.disabled) return;
    const prompt = button.dataset.prompt;
    if (inputEl) inputEl.value = prompt;
    handleUserMessage(prompt);
  });

  sendBtn?.addEventListener('click', () => {
    const value = inputEl?.value || '';
    if (inputEl) inputEl.value = '';
    handleUserMessage(value);
  });

  inputEl?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = inputEl.value;
      inputEl.value = '';
      handleUserMessage(value);
    }
  });
}

initSmartAssistant();
