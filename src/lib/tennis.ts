import { KICKOFF, MATCH_HOURS, MATCHES, VENUES, type Match, type VenueId } from "@/data/matches";

export const STORAGE_KEY = "bezeq_tennis_2026_27";
export const HOME_KEY = "bezeq_tennis_home_venue";

export type Entry = { played?: boolean; score?: string };
export type Entries = Record<string, Entry>;

export type RecordLine = { wins: number; draws: number; losses: number; scored: number };

const HE_MONTHS_LONG = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

const HE_MONTHS_SHORT = [
  "ינו׳",
  "פבר׳",
  "מרץ",
  "אפר׳",
  "מאי",
  "יוני",
  "יולי",
  "אוג׳",
  "ספט׳",
  "אוק׳",
  "נוב׳",
  "דצמ׳",
];

export function loadEntries(): Entries {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Entries;
  } catch {
    return {};
  }
}

export function loadHome(): VenueId | null {
  const raw = localStorage.getItem(HOME_KEY);
  if (raw === "yad" || raw === "hadar") return raw;
  return null;
}

export function dots(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function dayNum(iso: string): string {
  return String(Number(iso.slice(8, 10)));
}

export function monthShort(iso: string): string {
  return HE_MONTHS_SHORT[Number(iso.slice(5, 7)) - 1] ?? "";
}

export function longDate(iso: string): string {
  const day = Number(iso.slice(8, 10));
  const month = HE_MONTHS_LONG[Number(iso.slice(5, 7)) - 1] ?? "";
  const year = iso.slice(0, 4);
  return `${day} ב${month} ${year}`;
}

/** Israel civil DST: Friday before the last Sunday of March, through the last Sunday of October. */
export function jerusalemOffsetHours(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return isIsraelDst(y, m, d) ? 3 : 2;
}

function lastSunday(year: number, monthIndex: number): number {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  return last.getUTCDate() - last.getUTCDay();
}

function isIsraelDst(year: number, month: number, day: number): boolean {
  if (month < 3 || month > 10) return false;
  if (month > 3 && month < 10) return true;
  if (month === 3) {
    const friday = lastSunday(year, 2) - 2;
    return day >= friday;
  }
  return day < lastSunday(year, 9);
}

export function stamp(iso: string, hour: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, hour - jerusalemOffsetHours(iso), 0, 0));
  return utc.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function startHour(): number {
  return Number(KICKOFF.slice(0, 2));
}

export function calendarRange(iso: string): string {
  const start = startHour();
  return `${stamp(iso, start)}/${stamp(iso, start + MATCH_HOURS)}`;
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function eventTitle(match: Match): string {
  return `בזק תא-טניס נגד ${match.opponent}`;
}

export function eventDetails(match: Match): string {
  const venue = VENUES[match.venue];
  return `מחזור ${match.round} · ${venue.full} · ${KICKOFF} · ליגה למקומות עבודה, הפועל מחוז תל אביב`;
}

export function googleCalendarUrl(match: Match): string {
  const venue = VENUES[match.venue];
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(match),
    dates: calendarRange(match.date),
    details: eventDetails(match),
    location: venue.full,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function mapsUrl(match: Match): string {
  const query = encodeURIComponent(VENUES[match.venue].query);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function wazeUrl(match: Match): string {
  const query = encodeURIComponent(VENUES[match.venue].query);
  return `https://waze.com/ul?q=${query}&navigate=yes`;
}

export function buildIcs(matches: Match[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bezeq TA Tennis//Schedule//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const match of matches) {
    const venue = VENUES[match.venue];
    lines.push(
      "BEGIN:VEVENT",
      `UID:bezeq-tennis-2026-${match.id}@schedule`,
      `DTSTAMP:${stamp(match.date, startHour())}`,
      `DTSTART:${stamp(match.date, startHour())}`,
      `DTEND:${stamp(match.date, startHour() + MATCH_HOURS)}`,
      `SUMMARY:${icsEscape(eventTitle(match))}`,
      `LOCATION:${icsEscape(venue.full)}`,
      `DESCRIPTION:${icsEscape(eventDetails(match))}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(matches: Match[], filename: string) {
  const blob = new Blob([buildIcs(matches)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseScore(score: string | undefined): { us: number; them: number } | null {
  if (!score) return null;
  const match = score.trim().match(/^(\d+)\s*[-:–]\s*(\d+)$/);
  if (!match) return null;
  return { us: Number(match[1]), them: Number(match[2]) };
}

export function recordFrom(entries: Entries): RecordLine {
  const line: RecordLine = { wins: 0, draws: 0, losses: 0, scored: 0 };
  for (const entry of Object.values(entries)) {
    const parsed = parseScore(entry?.score);
    if (!parsed) continue;
    line.scored += 1;
    if (parsed.us > parsed.them) line.wins += 1;
    else if (parsed.us < parsed.them) line.losses += 1;
    else line.draws += 1;
  }
  return line;
}

export function playedCount(entries: Entries): number {
  return MATCHES.filter((match) => entries[match.id]?.played).length;
}

export function sameDayIds(): Set<number> {
  const byDate = new Map<string, number[]>();
  for (const match of MATCHES) {
    const list = byDate.get(match.date) ?? [];
    list.push(match.id);
    byDate.set(match.date, list);
  }
  const ids = new Set<number>();
  for (const list of byDate.values()) {
    if (list.length > 1) list.forEach((id) => ids.add(id));
  }
  return ids;
}

export function calendarDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysUntil(iso: string, now: Date): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((calendarDay(iso) - today) / 86_400_000);
}

export function whenLabel(iso: string, now: Date): string {
  const days = daysUntil(iso, now);
  if (days === 0) return "היום";
  if (days === 1) return "מחר";
  if (days > 1) return `עוד ${days} ימים`;
  if (days === -1) return "אתמול";
  return `לפני ${Math.abs(days)} ימים`;
}

export function whatsAppSeason(entries: Entries): string {
  const lines = [
    "לוח בזק תא-טניס 2026/27",
    "הפועל מחוז תל אביב · בית ערב 2 · כל המשחקים ב-19:00",
    "",
  ];
  for (const match of MATCHES) {
    const entry = entries[match.id];
    const score = entry?.score?.trim();
    const mark = entry?.played ? " · שוחק" : "";
    const result = score ? ` · ${score}` : "";
    lines.push(
      `${dots(match.date)} ${match.day} · מחזור ${match.round} · ${match.opponent} · ${VENUES[match.venue].short}${result}${mark}`,
    );
  }
  return lines.join("\n");
}

export function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

export function nextOpen(entries: Entries): Match[] {
  const open = MATCHES.filter((match) => !entries[match.id]?.played);
  if (open.length === 0) return [];
  const first = open[0]?.date;
  return open.filter((match) => match.date === first);
}
