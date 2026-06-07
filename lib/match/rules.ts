import type { Game, GamePlayer, PaymentStatus } from "@/lib/supabase/types";
import { deriveMatchType, getSkillGroup, SKILL_GROUP_LABEL } from "@/lib/feed/filters";

export type MatchJoinCta =
  | { action: "login"; label: string; href: string }
  | { action: "signup"; label: string; href: string }
  | { action: "choose_slot"; label: string; href: string }
  | { action: "pay_to_confirm"; label: string; href: string }
  | { action: "reserve_spot"; label: string; href: string }
  | { action: "request_join"; label: string; href: string }
  | { action: "join_waitlist"; label: string; href: string }
  | { action: "claim_spot"; label: string; href: string }
  | { action: "organizer_room"; label: string; href: string }
  | { action: "my_spot"; label: string; href: string }
  | { action: "disabled"; label: string; reason: string };

export function requiresApproval(game: Game): boolean {
  return Boolean(game.is_private);
}

export function usesWallet(game: Game): boolean {
  return game.payment_type === "online";
}

export function canPayLater(game: Game): boolean {
  return Boolean(game.allow_pay_later);
}

export function getPlayerCount(game: Game): number {
  return game.game_players?.length ?? 0;
}

export function isMatchFull(game: Game): boolean {
  return getPlayerCount(game) >= game.max_players;
}

export function spotsLeft(game: Game): number {
  return Math.max(0, game.max_players - getPlayerCount(game));
}

export function playersPerTeam(game: Game): number {
  const teams = game.num_teams > 0 ? game.num_teams : 1;
  return Math.ceil(game.max_players / teams);
}

export function teamPlayerCount(
  team: { game_players?: { id: string }[] }
): number {
  return team.game_players?.length ?? 0;
}

export function teamSpotsLeft(
  team: { game_players?: { id: string }[] },
  game: Game
): number {
  return Math.max(0, playersPerTeam(game) - teamPlayerCount(team));
}

export function isTeamFull(
  team: { game_players?: { id: string }[] },
  game: Game
): boolean {
  return teamSpotsLeft(team, game) <= 0;
}

export function isRosterConfirmed(status: PaymentStatus | undefined): boolean {
  return (
    status === "paid" ||
    status === "approved" ||
    status === "venue" ||
    status === "reserved"
  );
}

export function getMatchStatusBanner(game: Game): { tone: "warn" | "error" | "muted"; text: string } | null {
  if (game.status === "cancelled") {
    return { tone: "error", text: "This match was cancelled." };
  }
  if (game.registration_open === false) {
    return { tone: "warn", text: "Registration is closed." };
  }
  if (isMatchFull(game)) {
    return { tone: "warn", text: "Match is full. Join the waitlist for an open spot." };
  }
  return null;
}

export function getPaymentRuleLabel(game: Game): string {
  if (game.price_per_player === 0) return "Free";
  if (usesWallet(game)) {
    return canPayLater(game) ? "Wallet · pay now or reserve & pay later" : "Wallet · pay to reserve your spot";
  }
  return canPayLater(game) ? "Pay at venue · reserve now" : "Pay at venue on match day";
}

export function getJoinRuleLabel(game: Game): string {
  return requiresApproval(game)
    ? "Request approval · organizer picks who plays"
    : "Instant join · pay (or reserve) to hold your spot";
}

export function getMatchTypeLabel(game: Game): string {
  const t = game.match_type ?? deriveMatchType(game.format);
  return t === "futsal" ? "Futsal" : "Football";
}

export function getSkillLabel(game: Game): string | null {
  const g = getSkillGroup(game);
  return g ? SKILL_GROUP_LABEL[g] : null;
}

export function getVisibilityLabel(game: Game): string {
  return game.is_private ? "Private · approval required" : "Public";
}

export function resolveJoinCta(params: {
  game: Game;
  myEntry: GamePlayer | null;
  isGuest: boolean;
  hasUser: boolean;
  onWaitlist: boolean;
  spotOfferOpen?: boolean;
}): MatchJoinCta {
  const { game, myEntry, isGuest, hasUser, onWaitlist } = params;
  const base = `/games/${game.id}`;

  if (!hasUser) {
    return { action: "login", label: "Log in to join", href: `/login?next=${base}` };
  }
  if (isGuest) {
    return { action: "signup", label: "Create account to join", href: `/signup?next=${base}` };
  }

  if (game.status === "cancelled") {
    return { action: "disabled", label: "Match cancelled", reason: "This match is no longer running." };
  }
  if (game.registration_open === false && !myEntry) {
    return { action: "disabled", label: "Registration closed", reason: "The organizer closed registration." };
  }

  if (myEntry) {
    if (myEntry.payment_status === "pending_approval") {
      return {
        action: "my_spot",
        label: "Pending approval",
        href: `${base}/confirmed`,
      };
    }
    if (["reserved", "pending_payment", "pending"].includes(myEntry.payment_status)) {
      return {
        action: "pay_to_confirm",
        label: "Pay to confirm",
        href: `${base}/payment`,
      };
    }
    return {
      action: "my_spot",
      label: "View my spot",
      href: `${base}/confirmed`,
    };
  }

  if (onWaitlist && !isMatchFull(game) && spotsLeft(game) > 0) {
    return {
      action: "claim_spot",
      label: "Claim open spot",
      href: `${base}/join?claim=1`,
    };
  }

  if (isMatchFull(game)) {
    if (onWaitlist) {
      return {
        action: "disabled",
        label: "On waitlist",
        reason: "We'll notify everyone when a spot opens. First to accept gets in.",
      };
    }
    return {
      action: "join_waitlist",
      label: "Join waitlist",
      href: `${base}/join?waitlist=1`,
    };
  }

  if (requiresApproval(game)) {
    return {
      action: "request_join",
      label: "Request to join",
      href: `${base}/join`,
    };
  }

  if (usesWallet(game)) {
    return {
      action: "pay_to_confirm",
      label: "Pay to confirm",
      href: `${base}/join`,
    };
  }

  if (canPayLater(game)) {
    return {
      action: "reserve_spot",
      label: "Reserve spot",
      href: `${base}/join`,
    };
  }

  return {
    action: "choose_slot",
    label: "Choose slot",
    href: `${base}/join`,
  };
}
