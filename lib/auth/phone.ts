export function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/[^\d]/g, "");

  if (!digits) return "";
  if (plus) return `+${digits}`;
  if (digits.startsWith("09") && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.startsWith("63")) return `+${digits}`;
  return `+${digits}`;
}

export function isLikelyPhoneNumber(input: string): boolean {
  const normalized = normalizePhoneNumber(input);
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}
