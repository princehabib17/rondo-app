import { describe, it, afterEach, expect } from "vitest";
import { rememberJoinDestination, getJoinDestination, clearJoinDestination } from "@/lib/onboarding/intent";
const values = new Map<string, string>();
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
function setup() {
  values.clear();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } } });
}
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});
describe("signup return destination", () => {
  it("returns to the requested match after intermediate signup visits", () => {
    setup();
    rememberJoinDestination("/games/123/join?team=blue");
    rememberJoinDestination(null);
    expect(getJoinDestination()).toBe("/games/123/join?team=blue");
    clearJoinDestination();
    expect(getJoinDestination()).toBe("/feed");
  });
  it("rejects external destinations and auth loops", () => {
    setup();
    for (const path of ["https://evil.example", "//evil.example", "/signup", "/login", "/onboarding/account"]) {
      rememberJoinDestination(path);
      expect(getJoinDestination()).toBe("/feed");
    }
  });
  it("does not crash when storage is unavailable", () => {
    Object.defineProperty(globalThis, "window", { configurable: true, get() { throw new Error("storage blocked"); } });
    rememberJoinDestination("/games/123/join");
    expect(getJoinDestination()).toBe("/feed");
    clearJoinDestination();
  });
});
