export const HELP_TOPICS = [
  { value: "payment_issue", label: "Payment", hint: "Charged twice, top-up missing, wallet balance off" },
  { value: "refund_request", label: "Refund", hint: "Match cancelled or you can't make it" },
  { value: "game_cancelled", label: "Match cancelled", hint: "The organizer called it off" },
  { value: "organizer_issue", label: "Organizer", hint: "No-show, wrong venue, conduct" },
  { value: "player_issue", label: "Player", hint: "Conduct or safety on the pitch" },
  { value: "app_issue", label: "App problem", hint: "Something broke or looks wrong" },
  { value: "other", label: "Something else", hint: "Anything we missed" },
] as const;

export type HelpTopic = (typeof HELP_TOPICS)[number]["value"];

export function helpTopicLabel(value: string): string {
  return HELP_TOPICS.find((topic) => topic.value === value)?.label ?? value.replaceAll("_", " ");
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_review: "In review",
  refund_pending: "Refund pending",
  resolved: "Resolved",
  refunded: "Refunded",
  closed: "Closed",
};

export function helpStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function isHelpTicketClosed(status: string): boolean {
  return ["resolved", "refunded", "closed"].includes(status);
}
