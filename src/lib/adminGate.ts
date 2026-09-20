const UNLOCK_KEY = 'flyway.admin.unlock.v1';

function configuredPin(): string {
  return String(import.meta.env.VITE_ADMIN_PIN || '').trim();
}

export function adminPinConfigured(): boolean {
  return configuredPin().length >= 4 || import.meta.env.DEV;
}

export function isAdminUnlocked(): boolean {
  if (import.meta.env.DEV && !configuredPin()) return true;
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === 'ok';
  } catch {
    return false;
  }
}

export function unlockAdmin(input: string): boolean {
  const expected = configuredPin() || (import.meta.env.DEV ? 'dalil' : '');
  if (!expected) return false;
  if (input.trim() !== expected) return false;
  try {
    sessionStorage.setItem(UNLOCK_KEY, 'ok');
  } catch {
    /* private mode */
  }
  return true;
}

export function lockAdmin(): void {
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}
