/**
 * Security Service: Rate Limiting & Brute-Force Protection
 * Prevents password guessing attacks on offline/local authentication.
 * Enforces a temporary 60-second lockout after 5 consecutive failed attempts.
 */

const RATE_LIMIT_PREFIX = 'asphalt_sec_ratelimit_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 60 seconds lockout

interface RateLimitData {
  attempts: number;
  lockedUntil: number;
  lastAttemptAt: number;
}

const getStorageKey = (identifier: string): string => {
  const clean = (identifier || 'global').trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  return `${RATE_LIMIT_PREFIX}${clean}`;
};

const readRecord = (identifier: string): RateLimitData => {
  if (typeof window === 'undefined') {
    return { attempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(identifier));
    if (!raw) return { attempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
  }
};

const saveRecord = (identifier: string, data: RateLimitData): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(identifier), JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
};

export const securityRateLimitService = {
  MAX_ATTEMPTS,
  LOCKOUT_MS,

  /**
   * Checks if an account or device is currently in temporary lockout state.
   */
  checkRateLimit(identifier: string = 'global'): {
    isLocked: boolean;
    remainingSeconds: number;
    attempts: number;
  } {
    const record = readRecord(identifier);
    const now = Date.now();

    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingSeconds,
        attempts: record.attempts,
      };
    }

    // If lockout has elapsed, reset attempts
    if (record.lockedUntil && record.lockedUntil <= now) {
      this.resetRateLimit(identifier);
      return {
        isLocked: false,
        remainingSeconds: 0,
        attempts: 0,
      };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      attempts: record.attempts || 0,
    };
  },

  /**
   * Records a failed login attempt. Locks the account if limit reached.
   */
  recordFailedAttempt(identifier: string = 'global'): {
    isLocked: boolean;
    remainingSeconds: number;
    attempts: number;
    remainingAttempts: number;
  } {
    const record = readRecord(identifier);
    const now = Date.now();
    const newAttempts = (record.attempts || 0) + 1;

    let lockedUntil = record.lockedUntil;
    let isLocked = false;
    let remainingSeconds = 0;

    if (newAttempts >= MAX_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_MS;
      isLocked = true;
      remainingSeconds = Math.ceil(LOCKOUT_MS / 1000);
    }

    saveRecord(identifier, {
      attempts: newAttempts,
      lockedUntil,
      lastAttemptAt: now,
    });

    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - newAttempts);

    return {
      isLocked,
      remainingSeconds,
      attempts: newAttempts,
      remainingAttempts,
    };
  },

  /**
   * Resets failed attempts after a successful login.
   */
  resetRateLimit(identifier: string = 'global'): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(getStorageKey(identifier));
    } catch {
      // Ignore
    }
  },
};
