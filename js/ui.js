const FlariusUI = (() => {
  const PALETTE = [
    { bg: '#E8F0FE', fg: '#1E40AF' },
    { bg: '#FDF2F8', fg: '#9D174D' },
    { bg: '#ECFDF5', fg: '#047857' },
    { bg: '#FFF7ED', fg: '#C2410C' },
    { bg: '#F5F3FF', fg: '#6D28D9' },
    { bg: '#FEF3C7', fg: '#B45309' },
    { bg: '#E0F2FE', fg: '#0369A1' },
    { bg: '#FCE7F3', fg: '#BE185D' },
  ];

  const ICONS = {
    payroll: { bg: '#F5F3FF', fg: '#6D28D9', file: 'payroll.svg' },
    exchange: { bg: '#E0F2FE', fg: '#0369A1', file: 'exchange.svg' },
    coffee: { bg: '#FFF7ED', fg: '#C2410C', file: 'coffee.svg' },
    shopping: { bg: '#FDF2F8', fg: '#9D174D', file: 'shopping.svg' },
    transport: { bg: '#ECFDF5', fg: '#047857', file: 'transport.svg' },
    subscription: { bg: '#FEF3C7', fg: '#B45309', file: 'subscription.svg' },
  };

  function hashString(value) {
    let hash = 0;
    const str = String(value || '');
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getInitials(name, provided) {
    if (provided) return String(provided).slice(0, 2).toUpperCase();
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function getPalette(name) {
    return PALETTE[hashString(name) % PALETTE.length];
  }

  function getIconMeta(iconKey) {
    return ICONS[iconKey] || ICONS.payroll;
  }

  function resolveAssetPath(path, prefix = 'assets/') {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('../') || path.startsWith('assets/')) {
      return path;
    }
    return `${prefix}${path}`;
  }

  function normalizeAvatarType(type) {
    if (type === 'brand' || type === 'photo') return 'initials';
    return type || 'initials';
  }

  function renderAvatar(options = {}) {
    const {
      type = 'initials',
      name = '',
      initials,
      iconKey = 'payroll',
      emoji = '•',
      size = 'md',
      assetPrefix = 'assets/',
      className = '',
    } = options;

    const normalizedType = normalizeAvatarType(type);
    const sizeClass = size !== 'md' ? ` avatar--${size}` : '';
    const extraClass = className ? ` ${className}` : '';

    if (normalizedType === 'emoji') {
      return `<span class="avatar avatar--emoji${sizeClass}${extraClass}" aria-hidden="true">${emoji}</span>`;
    }

    if (normalizedType === 'icon') {
      const icon = getIconMeta(iconKey);
      const src = resolveAssetPath(`avatars/${icon.file}`, assetPrefix);
      return `<span class="avatar avatar--icon${sizeClass}${extraClass}" style="--avatar-bg:${icon.bg};--avatar-fg:${icon.fg}" aria-hidden="true"><img src="${src}" alt=""></span>`;
    }

    const label = getInitials(name, initials);
    const palette = getPalette(name || label);
    return `<span class="avatar avatar--initials${sizeClass}${extraClass}" style="--avatar-bg:${palette.bg};--avatar-fg:${palette.fg}" aria-hidden="true"><span class="avatar__label">${label}</span></span>`;
  }

  function renderTransactionAvatar(transaction, assetPrefix = 'assets/') {
    if (transaction.avatar === 'icon' || transaction.iconKey) {
      return renderAvatar({
        type: 'icon',
        iconKey: transaction.iconKey || 'payroll',
        assetPrefix,
      });
    }

    if (transaction.avatar === 'emoji') {
      return renderAvatar({
        type: 'emoji',
        emoji: transaction.avatarEmoji,
        assetPrefix,
      });
    }

    return renderAvatar({
      type: 'initials',
      name: transaction.title || transaction.avatarAlt || '',
      initials: transaction.initials,
      assetPrefix,
    });
  }

  function staggerChildren(container, itemSelector) {
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    container.querySelectorAll(itemSelector).forEach((item, index) => {
      item.style.setProperty('--stagger-delay', `${0.04 + index * 0.06}s`);
      item.classList.add('animate-stagger');
    });
  }

  function initPageAnimations(root = document) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    root.querySelector('.phone')?.classList.add('phone--entered');

    root.querySelectorAll('.transaction-list').forEach((list) => {
      staggerChildren(list, '.transaction');
    });

    root.querySelectorAll('.transfer-recipients-list, #transfer-history-list').forEach((list) => {
      staggerChildren(list, '.transfer-recipient-row');
    });

    root.querySelectorAll('.p2p-peers-list').forEach((list) => {
      staggerChildren(list, '.p2p-peer-row');
    });

    root.querySelectorAll('.quick-actions').forEach((group) => {
      group.querySelectorAll('.quick-action').forEach((item, index) => {
        item.style.setProperty('--stagger-delay', `${0.22 + index * 0.07}s`);
        item.classList.add('animate-stagger');
      });
    });
  }

  return {
    getInitials,
    getPalette,
    renderAvatar,
    renderTransactionAvatar,
    staggerChildren,
    initPageAnimations,
    resolveAssetPath,
  };
})();
