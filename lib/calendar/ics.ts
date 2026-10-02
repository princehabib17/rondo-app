/** Minimal RFC 5545 event so a booked match lands in the phone's calendar. */
export interface CalendarEventInput {
  uid: string;
  title: string;
  start: Date;
  durationMinutes: number;
  location?: string | null;
  description?: string | null;
  url?: string | null;
}

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildIcsEvent(event: CalendarEventInput): string {
  const end = new Date(event.start.getTime() + event.durationMinutes * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rondo//Matchday//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}@rondo`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.location ? `LOCATION:${escapeText(event.location)}` : null,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : null,
    event.url ? `URL:${event.url}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Kickoff in 2 hours. Pack your boots.",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** Triggers a download of the event; iOS and Android hand .ics files to the calendar app. */
export function downloadIcs(event: CalendarEventInput, filename = "rondo-match.ics") {
  const blob = new Blob([buildIcsEvent(event)], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
