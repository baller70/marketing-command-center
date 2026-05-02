type RateLimitEntry = { count: number; firstAttempt: number };

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

export function rateLimit(
  name: string,
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const store = getStore(name);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    store.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterMs = windowMs - (now - entry.firstAttempt);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return {
    error: "Too many requests. Please try again later.",
    retryAfter: retryAfterSec,
  };
}
