const STORAGE_KEY = 'flarius_cards_v1';

const DEFAULT_CARDS = [
  {
    id: 'card-virtual-1',
    type: 'virtual',
    label: 'Virtual',
    last4: '4821',
    number: '4444667777774821',
    cvv: '729',
    network: 'Visa',
    frozen: false,
    theme: 'gradient',
    status: 'active',
    pin: '7294',
    expiry: '09/28',
    holder: 'ROBERT HOTIM',
  },
  {
    id: 'card-physical-1',
    type: 'physical',
    label: 'Physical',
    last4: '9044',
    number: '4444667777779044',
    cvv: '381',
    network: 'Visa',
    frozen: false,
    theme: 'navy',
    status: 'active',
    pin: '3816',
    expiry: '09/28',
    holder: 'ROBERT HOTIM',
  },
];

const EYE_OPEN_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M1.5 10s3-5.5 8.5-5.5S18.5 10 18.5 10s-3 5.5-8.5 5.5S1.5 10 1.5 10Z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>`;
const EYE_CLOSED_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 3l14 14M8.2 8.2A2.5 2.5 0 0 0 10 12.5c.7 0 1.3-.3 1.8-.7M4.7 4.9C2.8 6.4 1.5 8.5 1.5 10s3 5.5 8.5 5.5c1.6 0 3-.4 4.2-1.1M12.7 12.7C11.5 13.5 10.3 14 9 14.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7.5 6.8C8.3 6.3 9.1 6 10 6c5.5 0 8.5 4 8.5 4s-.8 1.4-2.4 2.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const carousel = document.getElementById('cards-carousel');
const dotsEl = document.getElementById('cards-dots');
const listEl = document.getElementById('cards-list');
const overlay = document.getElementById('overlay');
const orderSheet = document.getElementById('order-sheet');
const detailsSheet = document.getElementById('details-sheet');
const pinSheet = document.getElementById('pin-sheet');
const detailsContent = document.getElementById('cards-details');
const pinDisplay = document.getElementById('cards-pin-display');
const freezeLabel = document.getElementById('freeze-label');
const toast = document.getElementById('toast');

let cards = [];
let activeIndex = 0;
let toastTimer;
let detailsRevealed = { number: false, cvv: false };

function normalizeCard(card) {
  const last4 = card.last4 || '0000';
  return {
    ...card,
    last4,
    number: card.number || `444466777777${last4}`,
    cvv: card.cvv || String(100 + Math.floor(Math.random() * 900)),
  };
}

function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cards = raw ? JSON.parse(raw).map(normalizeCard) : DEFAULT_CARDS.map(normalizeCard);
  } catch {
    cards = DEFAULT_CARDS.map(normalizeCard);
  }
}

function saveCards() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function formatCardNumberFull(number) {
  return String(number).replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function maskCardNumber(card) {
  return `•••• •••• •••• ${card.last4}`;
}

function resetDetailsReveal() {
  detailsRevealed = { number: false, cvv: false };
}

function updateDetailsSensitive(card) {
  const numberEl = document.getElementById('details-number');
  const cvvEl = document.getElementById('details-cvv');
  const numberEye = document.getElementById('details-number-eye');
  const cvvEye = document.getElementById('details-cvv-eye');

  if (numberEl) {
    numberEl.textContent = detailsRevealed.number
      ? formatCardNumberFull(card.number)
      : maskCardNumber(card);
  }

  if (cvvEl) {
    cvvEl.textContent = detailsRevealed.cvv ? card.cvv : '•••';
  }

  if (numberEye) {
    numberEye.innerHTML = detailsRevealed.number ? EYE_CLOSED_ICON : EYE_OPEN_ICON;
    numberEye.setAttribute('aria-label', detailsRevealed.number ? 'Hide card number' : 'Show card number');
    numberEye.setAttribute('aria-pressed', String(detailsRevealed.number));
  }

  if (cvvEye) {
    cvvEye.innerHTML = detailsRevealed.cvv ? EYE_CLOSED_ICON : EYE_OPEN_ICON;
    cvvEye.setAttribute('aria-label', detailsRevealed.cvv ? 'Hide CVV' : 'Show CVV');
    cvvEye.setAttribute('aria-pressed', String(detailsRevealed.cvv));
  }
}

function bindDetailsReveal(card) {
  document.getElementById('details-number-eye')?.addEventListener('click', () => {
    detailsRevealed.number = !detailsRevealed.number;
    updateDetailsSensitive(card);
  });

  document.getElementById('details-cvv-eye')?.addEventListener('click', () => {
    detailsRevealed.cvv = !detailsRevealed.cvv;
    updateDetailsSensitive(card);
  });
}

function getActiveCard() {
  return cards[activeIndex];
}

function renderCardFace(card, extraClass = '') {
  const frozenClass = card.frozen ? ' bank-card--frozen' : '';
  const themeClass = card.theme === 'navy' ? 'bank-card--navy' : 'bank-card--gradient';
  const statusBadge = card.status === 'shipping'
    ? '<span class="bank-card__badge">On its way</span>'
    : card.frozen
      ? '<span class="bank-card__badge">Frozen</span>'
      : '';

  return `
    <article class="bank-card ${themeClass}${frozenClass} ${extraClass}" data-card-id="${card.id}">
      ${statusBadge}
      <div class="bank-card__brand">Flarius</div>
      <div class="bank-card__footer">
        <span class="bank-card__last4">•• ${card.last4}</span>
        <span class="bank-card__network">Visa</span>
      </div>
    </article>
  `;
}

function updateCarouselState() {
  carousel?.querySelectorAll('.cards-carousel__slide').forEach((slide, index) => {
    slide.classList.toggle('cards-carousel__slide--active', index === activeIndex);
  });

  dotsEl?.querySelectorAll('.cards-carousel__dot').forEach((dot, index) => {
    dot.classList.toggle('cards-carousel__dot--active', index === activeIndex);
  });

  listEl?.querySelectorAll('.cards-list-item').forEach((item, index) => {
    item.classList.toggle('cards-list-item--active', index === activeIndex);
  });

  updateFreezeAction();
}

function scrollToActiveSlide(smooth = true) {
  const slide = carousel?.querySelector(`.cards-carousel__slide[data-index="${activeIndex}"]`);
  if (!slide) return;

  slide.scrollIntoView({
    behavior: smooth ? 'smooth' : 'instant',
    inline: 'center',
    block: 'nearest',
  });
}

function renderCarousel() {
  if (!carousel) return;

  if (!cards.length) {
    carousel.innerHTML = `
      <div class="cards-empty">
        <p>No cards yet</p>
        <button class="cards-empty__btn" type="button" id="cards-empty-add">Get your first card</button>
      </div>
    `;
    document.getElementById('cards-empty-add')?.addEventListener('click', () => openSheet(orderSheet));
    dotsEl.innerHTML = '';
    listEl.innerHTML = '';
    return;
  }

  carousel.innerHTML = cards.map((card, index) => `
    <div class="cards-carousel__slide${index === activeIndex ? ' cards-carousel__slide--active' : ''}" data-index="${index}">
      ${renderCardFace(card)}
    </div>
  `).join('');

  dotsEl.innerHTML = cards.map((_, index) => `
    <button type="button" class="cards-carousel__dot${index === activeIndex ? ' cards-carousel__dot--active' : ''}" data-index="${index}" aria-label="Card ${index + 1}"></button>
  `).join('');

  listEl.innerHTML = cards.map((card, index) => `
    <button type="button" class="cards-list-item${index === activeIndex ? ' cards-list-item--active' : ''}" data-index="${index}">
      <span class="cards-list-item__thumb bank-card bank-card--${card.theme} bank-card--mini">${card.type === 'virtual' ? 'V' : 'P'}</span>
      <span class="cards-list-item__body">
        <strong>${card.label} · ${card.last4}</strong>
        <small>${card.type === 'virtual' ? 'Virtual' : 'Physical'}${card.status === 'shipping' ? ' · On its way' : card.frozen ? ' · Frozen' : ''}</small>
      </span>
      <span class="cards-list-item__chevron">›</span>
    </button>
  `).join('');

  updateCarouselState();
  requestAnimationFrame(() => scrollToActiveSlide(false));
}

function setActiveIndex(index, { scroll = true } = {}) {
  const nextIndex = Math.max(0, Math.min(index, cards.length - 1));
  if (nextIndex === activeIndex) {
    if (scroll) scrollToActiveSlide();
    return;
  }

  activeIndex = nextIndex;
  updateCarouselState();
  if (scroll) scrollToActiveSlide();
}

function updateFreezeAction() {
  const card = getActiveCard();
  if (!card || !freezeLabel) return;
  freezeLabel.textContent = card.frozen ? 'Unfreeze' : 'Freeze';
}

function openSheet(sheet) {
  overlay?.classList.add('overlay--visible');
  [orderSheet, detailsSheet, pinSheet].forEach((el) => el?.classList.remove('sheet--visible'));
  sheet?.classList.add('sheet--visible');
}

function closeSheets() {
  overlay?.classList.remove('overlay--visible');
  [orderSheet, detailsSheet, pinSheet].forEach((el) => el?.classList.remove('sheet--visible'));
  resetDetailsReveal();
}

function orderCard(type) {
  const last4 = String(Math.floor(1000 + Math.random() * 9000));
  const newCard = normalizeCard({
    id: `card-${type}-${Date.now()}`,
    type,
    label: type === 'virtual' ? 'Virtual' : 'Physical',
    last4,
    number: `444466777777${last4}`,
    cvv: String(100 + Math.floor(Math.random() * 900)),
    network: 'Visa',
    frozen: false,
    theme: type === 'virtual' ? 'gradient' : 'navy',
    status: type === 'virtual' ? 'active' : 'shipping',
    pin: String(Math.floor(1000 + Math.random() * 9000)),
    expiry: '09/28',
    holder: 'ROBERT HOTIM',
  });

  cards.push(newCard);
  saveCards();
  activeIndex = cards.length - 1;
  renderCarousel();
  closeSheets();

  showToast(
    type === 'virtual'
      ? 'Virtual card created instantly'
      : 'Physical card ordered — arriving in 5–7 days'
  );
}

function toggleFreeze() {
  const card = getActiveCard();
  if (!card) return;
  card.frozen = !card.frozen;
  saveCards();
  renderCarousel();
  showToast(card.frozen ? 'Card frozen' : 'Card unfrozen');
}

function showDetails() {
  const card = getActiveCard();
  if (!card || !detailsContent) return;

  resetDetailsReveal();

  detailsContent.innerHTML = `
    <div class="cards-details__row">
      <span>Card number</span>
      <div class="cards-details__value">
        <strong id="details-number">${maskCardNumber(card)}</strong>
        <button type="button" class="cards-details__eye" id="details-number-eye" aria-label="Show card number" aria-pressed="false">${EYE_OPEN_ICON}</button>
      </div>
    </div>
    <div class="cards-details__row">
      <span>Expiry</span>
      <strong>${card.expiry}</strong>
    </div>
    <div class="cards-details__row">
      <span>CVV</span>
      <div class="cards-details__value">
        <strong id="details-cvv">•••</strong>
        <button type="button" class="cards-details__eye" id="details-cvv-eye" aria-label="Show CVV" aria-pressed="false">${EYE_OPEN_ICON}</button>
      </div>
    </div>
    <div class="cards-details__row">
      <span>Cardholder</span>
      <strong>${card.holder}</strong>
    </div>
    <div class="cards-details__row">
      <span>Type</span>
      <strong>${card.type === 'virtual' ? 'Virtual debit' : 'Physical debit'}</strong>
    </div>
    <div class="cards-details__row cards-details__row--last">
      <span>Status</span>
      <strong>${card.status === 'shipping' ? 'On its way' : card.frozen ? 'Frozen' : 'Active'}</strong>
    </div>
  `;

  bindDetailsReveal(card);
  openSheet(detailsSheet);
}

function showPin() {
  const card = getActiveCard();
  if (!card || !pinDisplay) return;
  pinDisplay.textContent = card.pin;
  openSheet(pinSheet);
}

document.getElementById('cards-add-btn')?.addEventListener('click', () => openSheet(orderSheet));

carousel?.addEventListener('click', (event) => {
  const slide = event.target.closest('.cards-carousel__slide');
  if (!slide) return;
  setActiveIndex(Number(slide.dataset.index));
});

dotsEl?.addEventListener('click', (event) => {
  const dot = event.target.closest('.cards-carousel__dot');
  if (!dot) return;
  setActiveIndex(Number(dot.dataset.index));
});

listEl?.addEventListener('click', (event) => {
  const item = event.target.closest('.cards-list-item');
  if (!item) return;
  setActiveIndex(Number(item.dataset.index));
});

document.querySelectorAll('[data-order]').forEach((btn) => {
  btn.addEventListener('click', () => orderCard(btn.dataset.order));
});

document.querySelectorAll('.cards-action').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = getActiveCard();
    if (!card) {
      openSheet(orderSheet);
      return;
    }

    switch (btn.dataset.action) {
      case 'details':
        showDetails();
        break;
      case 'freeze':
        toggleFreeze();
        break;
      case 'pin':
        showPin();
        break;
      case 'settings':
        showToast('Card settings — coming soon');
        break;
      default:
        break;
    }
  });
});

overlay?.addEventListener('click', closeSheets);

let touchStartX = 0;
let scrollSyncTimer;

carousel?.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

carousel?.addEventListener('touchend', (event) => {
  const diff = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) < 40) return;
  if (diff < 0 && activeIndex < cards.length - 1) setActiveIndex(activeIndex + 1);
  if (diff > 0 && activeIndex > 0) setActiveIndex(activeIndex - 1);
}, { passive: true });

carousel?.addEventListener('scroll', () => {
  clearTimeout(scrollSyncTimer);
  scrollSyncTimer = setTimeout(() => {
    const slides = [...carousel.querySelectorAll('.cards-carousel__slide')];
    if (!slides.length) return;

    const trackRect = carousel.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    let closestIndex = activeIndex;
    let minDistance = Infinity;

    slides.forEach((slide, index) => {
      const slideRect = slide.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distance = Math.abs(slideCenter - trackCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      activeIndex = closestIndex;
      updateCarouselState();
    }
  }, 80);
}, { passive: true });

loadCards();
renderCarousel();
