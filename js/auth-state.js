const FlariusAuth = (() => {
  const AUTH_KEY = 'flarius_auth_complete';
  const USER_KEY = 'flarius_auth_user';
  const SKIPPED_KEY = 'flarius_auth_skipped';

  const DEFAULT_USER = {
    firstName: 'Robert',
    lastName: 'Hotim',
    email: 'robert@flarius.com',
    phone: '+33 6 12 34 56 78',
    flaTag: 'robert',
  };

  function storageAvailable() {
    try {
      const key = '__flarius_auth_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  function isAuthenticated() {
    if (!storageAvailable()) {
      return sessionStorage.getItem(AUTH_KEY) === 'true';
    }
    return localStorage.getItem(AUTH_KEY) === 'true' || sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function getUser() {
    if (!storageAvailable()) {
      return { ...DEFAULT_USER };
    }

    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return { ...DEFAULT_USER };
      return { ...DEFAULT_USER, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_USER };
    }
  }

  function saveUser(user) {
    const merged = { ...getUser(), ...user };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
    return merged;
  }

  function complete(options = {}) {
    const { skipped = false, user = {} } = options;
    const merged = saveUser(user);

    try {
      localStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(AUTH_KEY, 'true');
      if (skipped) {
        localStorage.setItem(SKIPPED_KEY, 'true');
      } else {
        localStorage.removeItem(SKIPPED_KEY);
      }
    } catch {
      sessionStorage.setItem(AUTH_KEY, 'true');
    }

    return merged;
  }

  function reset() {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SKIPPED_KEY);
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }

  function redirectIfNeeded(authPath = 'screens/auth.html') {
    if (isAuthenticated()) return false;
    window.location.replace(`${authPath}?return=index.html`);
    return true;
  }

  function resolveHomeUrl(returnParam) {
    if (!returnParam) return '../index.html';

    try {
      const decoded = decodeURIComponent(returnParam);
      if (decoded.includes('auth.html')) return '../index.html';
      if (decoded.endsWith('index.html')) return '../index.html';
      if (decoded.startsWith('../')) return decoded;
      if (decoded.startsWith('screens/')) return `../${decoded.replace(/^screens\//, '')}`;
      return '../index.html';
    } catch {
      return '../index.html';
    }
  }

  function goHome(returnParam) {
    window.location.replace(resolveHomeUrl(returnParam));
  }

  function getDisplayName(user = getUser()) {
    return `${user.firstName || 'Robert'}`.trim();
  }

  function getFullName(user = getUser()) {
    return `${user.firstName || 'Robert'} ${user.lastName || 'Hotim'}`.trim();
  }

  return {
    complete,
    getDisplayName,
    getFullName,
    getUser,
    goHome,
    isAuthenticated,
    redirectIfNeeded,
    reset,
    saveUser,
  };
})();
