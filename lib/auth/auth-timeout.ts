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

export function withAuthTimeout<T>(promise: Promise<T>, ms = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AuthTimeoutError());
    }, ms);

    promise.then(
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
