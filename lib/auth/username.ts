const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "guest",
  "help",
  "login",
  "logout",
  "me",
  "mod",
  "moderator",
  "null",
  "official",
  "organizer",
  "profile",
  "rondo",
  "root",
  "settings",
  "signup",
  "support",
  "system",
  "undefined",
  "user",
  "username",
]);

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/^@+/, "");
}

export function isValidUsername(input: string): boolean {
  const username = normalizeUsername(input);
  if (!USERNAME_RE.test(username)) return false;
  if (RESERVED.has(username)) return false;
  return true;
}

export const USERNAME_MAX_LENGTH = 20;

export function sanitizeUsernameInput(input: string): string {
  return input.replace(/^@+/, "").toLowerCase().slice(0, USERNAME_MAX_LENGTH);
}

export function isReservedUsername(input: string): boolean {
  return RESERVED.has(normalizeUsername(input));
}

export type UsernameRuleId = "length" | "spaces" | "charset";

export type UsernameRuleState = {
  id: UsernameRuleId;
  label: string;
  met: boolean;
};

export function usernameRuleStates(input: string): UsernameRuleState[] {
  const value = input.replace(/^@+/, "");
  return [
    { id: "length", label: "3-20 characters", met: value.length >= 3 && value.length <= USERNAME_MAX_LENGTH },
    { id: "spaces", label: "No spaces", met: value.length > 0 && !/\s/.test(value) },
    { id: "charset", label: "Letters and numbers", met: value.length > 0 && /^[a-z0-9_]+$/.test(value) },
  ];
}

export function usernameValidationError(input: string): string | null {
  const username = normalizeUsername(input);
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 20) return "Username must be 20 characters or fewer.";
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Use only letters, numbers, and underscores.";
  }
  if (RESERVED.has(username)) return "That username is reserved.";
  if (!USERNAME_RE.test(username)) return "Enter a valid username.";
  return null;
}
