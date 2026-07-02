const STEPS = [
  'welcome',
  'sign-in',
  'otp',
  'personal',
  'fla-tag',
  'pin',
  'pin-confirm',
  'face-id',
  'done',
];

const WELCOME_ICONS = {
  wallet: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="3" y="7" width="20" height="14" rx="3" stroke="#fff" stroke-width="2"/><path d="M3 11h20" stroke="#fff" stroke-width="2"/><circle cx="19" cy="16" r="2" fill="#fff"/></svg>',
  send: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M3 13L23 5l-5 16-4-6-6-2 4-2 4-6z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>',
  shield: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 3l8 3v7c0 5.5-3.5 9.5-8 10-4.5-.5-8-4.5-8-10V6l8-3z" stroke="#fff" stroke-width="2"/><path d="M9 13l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const WELCOME_SLIDES = [
  {
    title: 'Manage your earnings at sea',
    description: 'Keep track of your income and stay on top of what matters.',
    image: '../assets/onboarding/earnings.svg',
    icon: 'wallet',
    accent: '#1565C0',
  },
  {
    title: 'Send money home in seconds',
    description: 'Fast, secure transfers to your loved ones, anytime, anywhere.',
    image: '../assets/onboarding/transfer.svg',
    icon: 'send',
    accent: '#D4577A',
  },
  {
    title: 'Stay in control of spending',
    description: 'Monitor your expenses, set limits, and make smarter financial choices.',
    image: '../assets/onboarding/spending.svg',
    icon: 'shield',
    accent: '#4BA3D8',
  },
];

const toast = document.getElementById('toast');
const authBack = document.getElementById('auth-back');
const authSkip = document.getElementById('auth-skip');
const authFooter = document.getElementById('auth-footer');
const authPrimary = document.getElementById('auth-primary');
const authLoading = document.getElementById('auth-loading');
const authLoadingText = document.getElementById('auth-loading-text');
const welcomeSubtitle = document.getElementById('welcome-subtitle');
const welcomeDescription = document.getElementById('welcome-description');
const welcomeIcon = document.getElementById('welcome-icon');
const welcomeIconWrap = document.getElementById('welcome-icon-wrap');
const welcomeSlide = document.getElementById('welcome-slide');
const welcomeIllustration = document.getElementById('welcome-illustration');
const welcomeDots = document.getElementById('welcome-dots');
const authProgressFill = document.getElementById('auth-progress-fill');
const authOtpTimer = document.getElementById('auth-otp-timer');
const authOtpResend = document.getElementById('auth-otp-resend');
const authPinError = document.getElementById('auth-pin-error');

const params = new URLSearchParams(window.location.search);
const returnUrl = params.get('return');

let currentStep = 'welcome';
let prevStepIndex = 0;
let welcomeIndex = 0;
let otpTimer;
let otpSeconds = 43;
let pinValue = '';
let pinConfirmValue = '';
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2200);
}

function showLoading(message) {
  if (!authLoading || !authLoadingText) return;
  authLoadingText.textContent = message;
  authLoading.classList.remove('auth-loading--hidden');
}

function hideLoading() {
  authLoading?.classList.add('auth-loading--hidden');
}

function getStepIndex(step = currentStep) {
  return STEPS.indexOf(step);
}

function updateProgressBar(step) {
  if (!authProgressFill) return;
  const index = getStepIndex(step);
  const pct = ((index + 1) / STEPS.length) * 100;
  authProgressFill.style.width = `${pct}%`;
}

function replayStepAnimations(section) {
  section?.querySelectorAll('.auth-anim').forEach((el) => {
    el.classList.remove('auth-anim--play');
    void el.offsetWidth;
    el.classList.add('auth-anim--play');
  });
}

function setStep(step) {
  hideLoading();
  const newIndex = getStepIndex(step);
  const direction = newIndex >= prevStepIndex ? 'forward' : 'back';

  document.querySelectorAll('.auth-step').forEach((section) => {
    const isActive = section.dataset.step === step;
    const wasActive = section.classList.contains('auth-step--active');
    section.classList.remove('auth-step--exit-forward', 'auth-step--exit-back');
    if (wasActive && !isActive) {
      section.classList.add(direction === 'forward' ? 'auth-step--exit-forward' : 'auth-step--exit-back');
    }
    section.classList.toggle('auth-step--active', isActive);
    if (isActive) replayStepAnimations(section);
  });

  prevStepIndex = newIndex;
  currentStep = step;
  updateProgressBar(step);

  const index = newIndex;
  const showBack = index > 0 && step !== 'done';
  authBack?.classList.toggle('auth-topbar__back--hidden', !showBack);
  authSkip?.classList.toggle('auth-topbar__skip--hidden', step === 'done');

  const footerSteps = ['welcome', 'personal', 'fla-tag', 'done'];
  const hideFooter = !footerSteps.includes(step);
  authFooter?.classList.toggle('auth-footer--hidden', hideFooter);

  if (step === 'welcome') {
    authPrimary.textContent = welcomeIndex === WELCOME_SLIDES.length - 1 ? 'Start' : 'Next';
    updateWelcomeSlide();
  } else if (step === 'personal' || step === 'fla-tag') {
    authPrimary.textContent = 'Continue';
  } else if (step === 'done') {
    authPrimary.textContent = 'Go to Home';
    updateDoneTitle();
  } else {
    /* no-op */
  }

  if (step === 'otp') {
    resetOtpInputs();
    startOtpTimer();
    document.querySelector('.auth-otp__box')?.focus();
  }

  if (step === 'pin') {
    pinValue = '';
    updatePinDots('auth-pin-dots', pinValue);
  }

  if (step === 'pin-confirm') {
    pinConfirmValue = '';
    authPinError?.classList.add('auth-error--hidden');
    updatePinDots('auth-pin-confirm-dots', pinConfirmValue);
  }

  if (step === 'fla-tag') {
    syncFlaTagPreview();
  }

  document.getElementById('auth-app')?.classList.add('phone--entered');
}

function goNext() {
  const index = getStepIndex();
  if (index < 0 || index >= STEPS.length - 1) return;
  setStep(STEPS[index + 1]);
}

function goBack() {
  const index = getStepIndex();
  if (index <= 0) return;
  setStep(STEPS[index - 1]);
}

function finishAuth(skipped = false) {
  hideLoading();

  const user = {
    firstName: document.getElementById('auth-first-name')?.value.trim() || 'Robert',
    lastName: document.getElementById('auth-last-name')?.value.trim() || 'Hotim',
    email: document.getElementById('auth-email')?.value.trim() || 'robert@flarius.com',
    phone: document.getElementById('auth-phone')?.value.trim() || '+33 6 12 34 56 78',
    flaTag: document.getElementById('auth-fla-tag')?.value.trim() || 'robert',
  };

  FlariusAuth.complete({ skipped, user });
  FlariusAuth.goHome(returnUrl);
}

function completeFaceIdStep() {
  showLoading('Setting up Face ID…');
  window.setTimeout(() => {
    hideLoading();
    finishAuth(false);
  }, 700);
}

function skipAuth() {
  FlariusAuth.complete({ skipped: true });
  FlariusAuth.goHome(returnUrl);
}

function updateWelcomeSlide(animate = false) {
  const slide = WELCOME_SLIDES[welcomeIndex];
  const img = document.getElementById('welcome-illustration-img');

  if (animate && welcomeSlide) {
    welcomeSlide.classList.remove('auth-welcome-v3__card--swap');
    void welcomeSlide.offsetWidth;
    welcomeSlide.classList.add('auth-welcome-v3__card--swap');
  }

  if (welcomeSubtitle) welcomeSubtitle.textContent = slide.title;
  if (welcomeDescription) welcomeDescription.textContent = slide.description;
  if (welcomeIcon) welcomeIcon.innerHTML = WELCOME_ICONS[slide.icon] || WELCOME_ICONS.wallet;
  if (welcomeIconWrap) welcomeIconWrap.style.background = slide.accent;
  if (img) {
    img.src = slide.image;
    img.alt = slide.title;
  }

  welcomeDots?.querySelectorAll('.auth-dots__dot').forEach((dot, index) => {
    const isActive = index === welcomeIndex;
    dot.classList.toggle('auth-dots__dot--active', isActive);
    dot.style.background = isActive ? slide.accent : '';
  });

  if (currentStep === 'welcome') {
    authPrimary.textContent = welcomeIndex === WELCOME_SLIDES.length - 1 ? 'Start' : 'Next';
  }
}

function handleWelcomePrimary() {
  if (welcomeIndex < WELCOME_SLIDES.length - 1) {
    welcomeIndex += 1;
    updateWelcomeSlide(true);
    return;
  }
  goNext();
}

function mockSocialSignIn(provider) {
  showLoading(`Connecting to ${provider}…`);
  setTimeout(() => {
    hideLoading();
    showToast(`${provider} sign-in successful (demo)`);
    setStep('otp');
  }, 900);
}

function handlePhoneContinue() {
  const phone = document.getElementById('auth-phone')?.value.trim();
  if (!phone) {
    showToast('Enter a phone number');
    return;
  }
  showLoading('Sending verification code…');
  setTimeout(() => {
    hideLoading();
    setStep('otp');
  }, 700);
}

function resetOtpInputs() {
  document.querySelectorAll('.auth-otp__box').forEach((input) => {
    input.value = '';
    input.classList.remove('auth-otp__box--filled');
  });
}

function startOtpTimer() {
  clearInterval(otpTimer);
  otpSeconds = 43;
  authOtpResend?.classList.add('auth-link--hidden');
  authOtpTimer?.classList.remove('auth-otp__timer--hidden');
  updateOtpTimerLabel();
  otpTimer = setInterval(() => {
    otpSeconds -= 1;
    if (otpSeconds <= 0) {
      clearInterval(otpTimer);
      authOtpTimer?.classList.add('auth-otp__timer--hidden');
      authOtpResend?.classList.remove('auth-link--hidden');
      return;
    }
    updateOtpTimerLabel();
  }, 1000);
}

function updateOtpTimerLabel() {
  if (!authOtpTimer) return;
  const minutes = String(Math.floor(otpSeconds / 60)).padStart(2, '0');
  const seconds = String(otpSeconds % 60).padStart(2, '0');
  authOtpTimer.textContent = `Resend code in ${minutes}:${seconds}`;
}

function getOtpValue() {
  return Array.from(document.querySelectorAll('.auth-otp__box'))
    .map((input) => input.value)
    .join('');
}

function handleOtpComplete() {
  const code = getOtpValue();
  if (code.length < 6) return;
  showLoading('Verifying code…');
  setTimeout(() => {
    hideLoading();
    setStep('personal');
  }, 600);
}

function initOtpInputs() {
  const boxes = Array.from(document.querySelectorAll('.auth-otp__box'));
  boxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      box.classList.toggle('auth-otp__box--filled', Boolean(box.value));
      if (box.value && boxes[index + 1]) boxes[index + 1].focus();
      if (getOtpValue().length === 6) handleOtpComplete();
    });

    box.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !box.value && boxes[index - 1]) {
        boxes[index - 1].focus();
      }
    });

    box.addEventListener('paste', (event) => {
      event.preventDefault();
      const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      pasted.split('').forEach((digit, digitIndex) => {
        if (boxes[digitIndex]) boxes[digitIndex].value = digit;
      });
      if (pasted.length === 6) handleOtpComplete();
    });
  });
}

function syncFlaTagPreview() {
  const firstName = document.getElementById('auth-first-name')?.value.trim() || 'Robert';
  const lastName = document.getElementById('auth-last-name')?.value.trim() || 'Hotim';
  const flaTag = document.getElementById('auth-fla-tag')?.value.trim() || 'robert';
  const initials = FlariusUI.getInitials(`${firstName} ${lastName}`);
  const palette = FlariusUI.getPalette(`${firstName} ${lastName}`);

  const avatar = document.getElementById('auth-preview-avatar');
  if (avatar) {
    avatar.style.setProperty('--avatar-bg', palette.bg);
    avatar.style.setProperty('--avatar-fg', palette.fg);
    avatar.querySelector('.avatar__label').textContent = initials;
  }

  const nameEl = document.getElementById('auth-preview-name');
  const tagEl = document.getElementById('auth-preview-tag');
  if (nameEl) nameEl.textContent = `${firstName} ${lastName}`;
  if (tagEl) tagEl.textContent = `#${flaTag}`;
}

function updatePinDots(containerId, value) {
  const dots = document.getElementById(containerId)?.querySelectorAll('span');
  dots?.forEach((dot, index) => {
    dot.classList.toggle('auth-pin-dots__filled', index < value.length);
  });
}

function bindKeypad(containerId, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-key]');
    if (!button) return;

    const key = button.dataset.key;
    let value = containerId === 'auth-keypad' ? pinValue : pinConfirmValue;

    if (key === 'back') {
      value = value.slice(0, -1);
    } else {
      value = `${value}${key}`.slice(0, 4);
    }

    if (containerId === 'auth-keypad') {
      pinValue = value;
      updatePinDots('auth-pin-dots', pinValue);
      if (pinValue.length === 4) {
        setTimeout(() => setStep('pin-confirm'), 250);
      }
    } else {
      pinConfirmValue = value;
      updatePinDots('auth-pin-confirm-dots', pinConfirmValue);
      if (pinConfirmValue.length === 4) {
        if (pinConfirmValue === pinValue) {
          authPinError?.classList.add('auth-error--hidden');
          setTimeout(() => setStep('face-id'), 250);
        } else {
          authPinError?.classList.remove('auth-error--hidden');
          pinConfirmValue = '';
          updatePinDots('auth-pin-confirm-dots', pinConfirmValue);
        }
      }
    }

    onComplete?.(value);
  });
}

function updateDoneTitle() {
  const firstName = document.getElementById('auth-first-name')?.value.trim() || 'Robert';
  const title = document.getElementById('auth-done-title');
  if (title) title.textContent = `Welcome aboard, ${firstName}!`;
}

function handlePrimary() {
  hideLoading();

  switch (currentStep) {
    case 'welcome':
      handleWelcomePrimary();
      break;
    case 'personal':
      goNext();
      break;
    case 'fla-tag':
      syncFlaTagPreview();
      goNext();
      break;
    case 'done':
      finishAuth(false);
      break;
    default:
      break;
  }
}

function initAuth() {
  if (FlariusAuth.isAuthenticated()) {
    FlariusAuth.goHome(returnUrl);
    return;
  }

  setStep('welcome');
  initOtpInputs();
  bindKeypad('auth-keypad');
  bindKeypad('auth-keypad-confirm');

  authBack?.addEventListener('click', goBack);
  authSkip?.addEventListener('click', skipAuth);
  authPrimary?.addEventListener('click', handlePrimary);
  document.getElementById('auth-phone-continue')?.addEventListener('click', handlePhoneContinue);
  document.getElementById('auth-otp-resend')?.addEventListener('click', () => {
    resetOtpInputs();
    startOtpTimer();
    showToast('New code sent (demo)');
  });

  document.querySelectorAll('[data-social]').forEach((button) => {
    button.addEventListener('click', () => mockSocialSignIn(button.dataset.social));
  });

  document.getElementById('auth-first-name')?.addEventListener('input', syncFlaTagPreview);
  document.getElementById('auth-last-name')?.addEventListener('input', syncFlaTagPreview);
  document.getElementById('auth-fla-tag')?.addEventListener('input', syncFlaTagPreview);

  document.getElementById('auth-face-enable')?.addEventListener('click', completeFaceIdStep);
  document.getElementById('auth-face-skip')?.addEventListener('click', () => finishAuth(false));
}

initAuth();
