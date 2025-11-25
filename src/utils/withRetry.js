export async function withRetry(fn, { maxAttempts = 5, baseMs = 250 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.code;
      const retriable = status === 429 || (status >= 500 && status < 600);
      if (!retriable || attempt >= maxAttempts - 1) throw err;

      // backoff exponencial + jitter
      const jitter = Math.random() * baseMs;
      const delay = Math.min(8000, Math.pow(2, attempt) * baseMs + jitter);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
}
