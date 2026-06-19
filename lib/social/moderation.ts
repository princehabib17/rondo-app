/**
 * Keyword-based content filter for the social feed (v1). Swap or augment with
 * a third-party moderation API later — keep the return shape stable.
 */

const BLOCKED_WORDS = [
  // English profanity/slurs
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "whore",
  "slut",
  // Filipino profanity
  "putangina",
  "tangina",
  "tarantado",
  "gago",
  "ulol",
  "kantot",
  "puta",
];

// Obfuscation-resistant: strip separators inside words so "f.u.c.k" and
// "f u c k" still match, and fold common digit/symbol substitutions.
const SUBSTITUTIONS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => SUBSTITUTIONS[ch] ?? ch)
    .join("")
    .replace(/[^a-zñ]+/g, " ");
}

export interface ModerationResult {
  ok: boolean;
  /** First matched term, for logging — never echo this back to the user. */
  matched?: string;
}

const BLOCKED_PATTERNS = BLOCKED_WORDS.map((word) => new RegExp(`\\b${word}\\b`));

export function moderateContent(text: string): ModerationResult {
  const spaced = normalize(text);
  const collapsed = spaced.replace(/ /g, "");
  for (let i = 0; i < BLOCKED_WORDS.length; i++) {
    const word = BLOCKED_WORDS[i];
    if (BLOCKED_PATTERNS[i].test(spaced)) {
      return { ok: false, matched: word };
    }
    // Substring match on collapsed text catches "f.u.c.k.i.n.g"-style
    // obfuscation, but only for longer terms — short ones false-positive
    // inside ordinary words (e.g. "repUTAble").
    if (word.length >= 6 && collapsed.includes(word)) {
      return { ok: false, matched: word };
    }
  }
  return { ok: true };
}

export const MODERATION_REJECTION_MESSAGE =
  "That post contains language we don't allow. Keep it friendly and try again.";
