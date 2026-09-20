const UNLOCK_KEY = 'flyway.admin.unlock.v1';
const UNLOCK_VALUE = 'ok';
export const ADMIN_PASSCODE = 'admin123';

function extraPin(): string {
  return String(import.meta.env.VITE_ADMIN_PIN || '').trim();
}

function isValidPasscode(input: string): boolean {
  const value = input.trim();
  if (!value) return false;
  if (value === ADMIN_PASSCODE) return true;
  const extra = extraPin();
  return Boolean(extra) && value === extra;
}

function readUnlockFlag(): string | null {
  try {
    const persisted = localStorage.getItem(UNLOCK_KEY);
    if (persisted) return persisted;
    const session = sessionStorage.getItem(UNLOCK_KEY);
    if (session) {
      localStorage.setItem(UNLOCK_KEY, session);
      sessionStorage.removeItem(UNLOCK_KEY);
      return session;
    }
  } catch {
    /* private mode */
  }
  return null;
}

export function adminPinConfigured(): boolean {
  return true;
}

export function isAdminUnlocked(): boolean {
  return readUnlockFlag() === UNLOCK_VALUE;
}

export function unlockAdmin(input: string): boolean {
  if (!isValidPasscode(input)) return false;
  try {
    localStorage.setItem(UNLOCK_KEY, UNLOCK_VALUE);
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* private mode — still treat this attempt as authenticated for the current view */
  }
  return true;
}

export function lockAdmin(): void {
  try {
    localStorage.removeItem(UNLOCK_KEY);
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}
