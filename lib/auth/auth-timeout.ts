/** Fail auth screens instead of hanging when Supabase DNS/network is down. */
export const AUTH_TIMEOUT_MS = 2000;

export const AUTH_UNREACHABLE_MESSAGE =
  "Auth service is unreachable right now. The Supabase project may be paused or misconfigured.";

export class AuthTimeoutError extends Error {
  constructor(message = AUTH_UNREACHABLE_MESSAGE) {
    super(message);
    this.name = "AuthTimeoutError";
  }
}

/** Accept real Promises and thenables (Supabase query builders). */
export function withAuthTimeout<T>(thenable: PromiseLike<T>, ms = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AuthTimeoutError());
    }, ms);

    Promise.resolve(thenable).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function withAuthTimeoutOr<T>(
  thenable: PromiseLike<T>,
  fallback: T,
  ms = AUTH_TIMEOUT_MS
): Promise<T> {
  try {
    return await withAuthTimeout(thenable, ms);
  } catch {
    return fallback;
  }
}
