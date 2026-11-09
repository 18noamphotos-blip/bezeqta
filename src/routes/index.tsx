import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CalendarPlus,
  Clock,
  MapPin,
  Navigation,
  Share2,
  TriangleAlert,
} from "lucide-react";
import { KICKOFF, MATCHES, VENUES, type Match, type VenueId } from "@/data/matches";
import {
  HOME_KEY,
  dayNum,
  daysUntil,
  downloadIcs,
  dots,
  loadHome,
  longDate,
  mapsUrl,
  monthShort,
  nextOpen,
  openWhatsApp,
  playedCount,
  recordFrom,
  sameDayIds,
  wazeUrl,
  whatsAppSeason,
  whenLabel,
  type Entries,
} from "@/lib/tennis";
import { listMarks, saveMark, type SharedMark } from "@/lib/marks.functions";

import { mergeSharedSnapshot } from "@/lib/shared-marks";
import { buildMarkPayload } from "@/lib/mark-payload";
import { ALLOWED_SCORES, allowedScore, outcomeFromScore, scoreForOutcome, scoreSelection, type Outcome } from "@/lib/score-selection";

export const Route = createFileRoute("/")({ component: Home });

const CLASHES = sameDayIds();
const STORAGE_KEY = "bezeq_tennis_shared_v1";
type Filter = "all" | "open" | "played";

function Home() {
  const [entries, setEntries] = useState<Entries>({});
  const [home, setHome] = useState<VenueId | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState(false);
  const entriesRef = useRef(entries);
  const inflight = useRef(new Map<number, number>());
  const tries = useRef(new Map<number, number>());
  const seq = useRef(0);
  const remoteVersion = useRef(-1);

  function remember(next: Entries) {
    entriesRef.current = next;
    setEntries(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function applyRemote(rows: SharedMark[]) {
    const merged = mergeSharedSnapshot(rows, remoteVersion.current, entriesRef.current, inflight.current.keys());
    if (!merged) return;
    remoteVersion.current = merged.version;
    remember(merged.entries);
  }

  function push(id: number, entry: { played?: boolean; score?: string }) {
    const ticket = ++seq.current;
    inflight.current.set(id, ticket);
    const payload = buildMarkPayload(id, entry);
    void saveMark({ data: payload })
      .then((rows) => {
        if (inflight.current.get(id) !== ticket) return;
        const latest = entriesRef.current[id];
        const same =
          Boolean(latest?.played) === payload.played &&
          (latest?.score ?? "").trim().slice(0, 8) === payload.score;
        inflight.current.delete(id);
        tries.current.delete(id);
        if (!same) {
          // A newer local edit won the race; queue that instead of stalling on -1.
          window.setTimeout(() => push(id, entriesRef.current[id] ?? entry), 0);
          return;
        }
        applyRemote(rows);
        if (inflight.current.size === 0) setSyncError(false);
      })
      .catch(() => {
        if (inflight.current.get(id) !== ticket) return;
        const attempt = (tries.current.get(id) ?? 0) + 1;
        tries.current.set(id, attempt);
        setSyncError(true);
        if (attempt < 3) {
          window.setTimeout(() => {
            if (inflight.current.get(id) !== ticket) return;
            push(id, entriesRef.current[id] ?? entry);
          }, 2000);
        }
      });
  }

  useEffect(() => {
    let cancelled = false;
    // Shared board is authoritative. Never read or upload old device scores.
    setHome(loadHome());
    setNow(new Date());
    const clock = window.setInterval(() => setNow(new Date()), 60_000);

    async function refresh() {
      try {
        const rows = await listMarks();
        if (cancelled) return;
        applyRemote(rows);
        // A successful poll after a prolonged outage retries only current edits.
        for (const [id, ticket] of inflight.current) {
          if (ticket > 0 && (tries.current.get(id) ?? 0) >= 3) {
            tries.current.delete(id);
            push(id, entriesRef.current[id] ?? {});
          }
        }
        if (inflight.current.size === 0) setSyncError(false);
      } catch {
        if (!cancelled) setSyncError(true);
      }
    }

    void refresh();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 6000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(clock);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const played = playedCount(entries);
  const record = recordFrom(entries);
  const upcoming = useMemo(() => nextOpen(entries), [entries]);
  const visible = MATCHES.filter((match) => {
    const isPlayed = Boolean(entries[match.id]?.played);
    if (filter === "played") return isPlayed;
    if (filter === "open") return !isPlayed;
    return true;
  });

  const scoreTimers = useRef(new Map<number, number>());

  function patch(id: number, partial: Partial<Entries[string]>, immediate: boolean) {
    const current = entriesRef.current[id] ?? {};
    const nextEntry = { ...current, ...partial };
    remember({ ...entriesRef.current, [id]: nextEntry });
    if (!inflight.current.has(id)) inflight.current.set(id, -1);
    const pending = scoreTimers.current.get(id);
    if (pending) window.clearTimeout(pending);
    if (immediate) {
      scoreTimers.current.delete(id);
      push(id, nextEntry);
      return;
    }
    scoreTimers.current.set(
      id,
      window.setTimeout(() => {
        scoreTimers.current.delete(id);
        push(id, entriesRef.current[id] ?? nextEntry);
      }, 350),
    );
  }

  function chooseHome(venue: VenueId | null) {
    setHome(venue);
    if (venue) localStorage.setItem(HOME_KEY, venue);
    else localStorage.removeItem(HOME_KEY);
  }

  const clashOpen = MATCHES.filter(
    (match) => CLASHES.has(match.id) && !entries[match.id]?.played,
  );

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="bg-hapoel text-on-red">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-7">
          <p className="text-sm font-medium text-on-red/80">
            ליגה למקומות עבודה · הפועל מחוז תל אביב
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
              בזק תא-טניס
            </h1>
            <span className="rounded-full bg-on-red/15 px-3 py-1 text-sm font-semibold">
              בית ערב 2
            </span>
          </div>
          <p className="mt-3 text-base text-on-red/90">
            לוח משחקים · עונת 2026/27 · טניס שדה
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-on-red/80">
            <Clock className="size-4" aria-hidden="true" />
            כל המשחקים בשעה {KICKOFF}
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-3xl px-4 pb-16">
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
          {upcoming.length === 0 ? (
            <div>
              <p className="text-sm font-semibold text-hapoel">סוף עונה</p>
              <h2 className="mt-1 text-2xl font-extrabold">כל 12 המשחקים סומנו</h2>
              <p className="mt-1 text-sm text-muted">
                המאזן לפי התוצאות שהוזנו: אנחנו מול היריב.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-hapoel">המשחק הבא</p>
                {now ? (
                  <p className="text-sm font-semibold">{whenLabel(upcoming[0].date, now)}</p>
                ) : (
                  <p className="text-sm text-muted">{dots(upcoming[0].date)}</p>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {upcoming[0].day} · {longDate(upcoming[0].date)}
                {now && daysUntil(upcoming[0].date, now) < 0 ? " · התאריך עבר ועדיין לא סומן" : ""}
              </p>
              <ul className="mt-3 flex flex-col gap-3">
                {upcoming.map((match) => (
                  <li key={match.id} className="rounded-xl bg-bg px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted">מחזור {match.round}</p>
                        <p className="text-lg font-extrabold leading-snug">{match.opponent}</p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                          <MapPin className="size-4 shrink-0 text-hapoel" aria-hidden="true" />
                          {VENUES[match.venue].full}
                          <HomeTag venue={match.venue} home={home} />
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-extrabold text-hapoel">{KICKOFF}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <ActionLink href={wazeUrl(match)} label="ווייז" icon={<Navigation className="size-4" />} primary />
                      <ActionLink href={mapsUrl(match)} label="מפות" icon={<MapPin className="size-4" />} />
                      <ActionButton
                        label="יומן"
                        icon={<CalendarPlus className="size-4" />}
                        onClick={() => downloadIcs([match], `bezeq-tennis-match-${match.id}.ics`)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <Stat label="שוחקו" value={String(played)} />
            <Stat label="נותרו" value={String(MATCHES.length - played)} />
            <Stat label="מאזן" value={record.scored ? `${record.wins}–${record.draws}–${record.losses}` : "—"} />
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-hapoel"
              style={{ width: `${(played / MATCHES.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">מאזן: ניצחונות–תיקו–הפסדים. התוצאה היא אנחנו–יריב, למשל 2-1. הסימון משותף לכל הקבוצה.</p>
        </section>

        {clashOpen.length > 1 ? (
          <p className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-hapoel-soft px-4 py-3 text-sm text-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-hapoel" aria-hidden="true" />
            <span>
              ב-{dots(clashOpen[0].date)} רשומים {clashOpen.length} משחקים ב-{KICKOFF}:{" "}
              {clashOpen.map((match) => `${match.opponent} ב${VENUES[match.venue].short}`).join(", ")}.
            </span>
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex rounded-full bg-surface p-1 shadow-sm" role="tablist" aria-label="סינון משחקים">
            <FilterButton current={filter} id="open" count={MATCHES.length - played} onSelect={setFilter}>
              פתוחים
            </FilterButton>
            <FilterButton current={filter} id="played" count={played} onSelect={setFilter}>
              שוחקו
            </FilterButton>
            <FilterButton current={filter} id="all" count={MATCHES.length} onSelect={setFilter}>
              הכל
            </FilterButton>
          </div>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {visible.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
              {filter === "played" ? "עדיין אין משחקים מסומנים." : "אין משחקים פתוחים."}
            </li>
          ) : (
            visible.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                played={Boolean(entries[match.id]?.played)}
                score={entries[match.id]?.score ?? ""}
                home={home}
                past={now ? daysUntil(match.date, now) < 0 : false}
                onPlayed={(value) => patch(match.id, value ? { played: true } : { played: false, score: "" }, true)}
                onScore={(value) => {
                  const selection = scoreSelection(value);
                  if (selection) patch(match.id, selection, true);
                }}
              />
            ))
          )}
        </ul>

        <p className="mt-5 text-xs font-medium text-muted">מגרש ביתי — לסימון בית וחוץ על הכרטיסים</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <HomeButton active={home === "yad"} onClick={() => chooseHome(home === "yad" ? null : "yad")}>
            יד אליהו
          </HomeButton>
          <HomeButton
            active={home === "hadar"}
            onClick={() => chooseHome(home === "hadar" ? null : "hadar")}
          >
            הדר יוסף
          </HomeButton>
          <HomeButton active={home === null} onClick={() => chooseHome(null)}>
            בלי סימון
          </HomeButton>
        </div>

        <section className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-hapoel px-3 text-sm font-semibold text-on-red"
            onClick={() => openWhatsApp(whatsAppSeason(entries))}
          >
            <Share2 className="size-4" aria-hidden="true" />
            שליחה לוואטסאפ
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold"
            onClick={() => downloadIcs(MATCHES, "bezeq-tennis-2026-27.ics")}
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            כל העונה ליומן
          </button>
        </section>

        <footer className="mt-6 text-center text-xs leading-relaxed text-muted">
          {syncError ? "הסימון עדיין לא הגיע לשאר. ננסה שוב." : "מחזור 1 הוא פטור, בלי יריבה."}
          <br />
          הסימונים והתוצאות משותפים לכל מי שנכנס לאתר.
          <br />
          מקור: לוח הליגה למקומות עבודה, הפועל מחוז תל אביב · עונת 2026/27.
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

function HomeTag({ venue, home }: { venue: VenueId; home: VenueId | null }) {
  if (!home) return null;
  const ours = venue === home;
  return (
    <span className="rounded-full bg-hapoel-soft px-2 py-0.5 text-xs font-semibold text-hapoel">
      {ours ? "בית" : "חוץ"}
    </span>
  );
}

function FilterButton({
  current,
  id,
  count,
  onSelect,
  children,
}: {
  current: Filter;
  id: Filter;
  count: number;
  onSelect: (id: Filter) => void;
  children: string;
}) {
  const active = current === id;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`h-10 rounded-full px-3 text-sm font-semibold ${
        active ? "bg-hapoel text-on-red" : "text-muted"
      }`}
      onClick={() => onSelect(id)}
    >
      {children} {count}
    </button>
  );
}

function HomeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-11 rounded-xl border text-sm font-semibold ${
        active ? "border-hapoel bg-hapoel-soft text-hapoel" : "border-line bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ActionLink({
  href,
  label,
  icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-1 rounded-xl text-sm font-semibold ${
        primary ? "bg-hapoel text-on-red" : "border border-line bg-surface text-ink"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  primary = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-1 rounded-xl text-sm font-semibold ${
        primary ? "bg-hapoel text-on-red" : "border border-line bg-surface text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MatchCard({
  match,
  played,
  score,
  home,
  past,
  onPlayed,
  onScore,
}: {
  match: Match;
  played: boolean;
  score: string;
  home: VenueId | null;
  past: boolean;
  onPlayed: (played: boolean) => void;
  onScore: (score: string) => void;
}) {
  return (
    <li className={`rounded-2xl border bg-surface p-3 shadow-sm ${played ? "border-line" : "border-line"}`}>
      <div className="flex gap-3">
        <div
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${
            played ? "bg-line text-muted" : "bg-hapoel text-on-red"
          }`}
        >
          <span className="text-xl font-extrabold leading-none">{dayNum(match.date)}</span>
          <span className="mt-0.5 text-xs font-medium">{monthShort(match.date)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted">
              מחזור {match.round} · {match.day}
              {CLASHES.has(match.id) ? " · גם משחק נוסף" : ""}
              {!played && past ? " · עבר" : ""}
            </p>
            <p className={`text-sm font-extrabold ${played ? "text-muted" : "text-hapoel"}`}>{KICKOFF}</p>
          </div>
          <p className={`mt-0.5 text-base font-extrabold leading-snug ${played ? "text-muted line-through" : ""}`}>
            {match.opponent}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {VENUES[match.venue].short}
            <span className="text-muted">·</span>
            {dots(match.date)}
            <HomeTag venue={match.venue} home={home} />
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 items-end gap-2">
        <label className="inline-flex h-11 min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-line px-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="size-5 accent-hapoel"
            checked={played}
            aria-label={`סמן ששוחק נגד ${match.opponent}`}
            onChange={(event) => onPlayed(event.target.checked)}
          />
          שוחק
        </label>
        <label className="min-w-0 text-xs font-semibold text-muted">
          תוצאה
          <select
            dir="ltr"
            value={allowedScore(score) ? score : ""}
            aria-label={`תוצאה נגד ${match.opponent}, אנחנו מול היריב`}
            onChange={(event) => onScore(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-center text-base font-semibold text-ink"
          >
            <option value="" aria-label="ללא תוצאה"></option>
            {ALLOWED_SCORES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-xs font-semibold text-muted">
          ניצחון / הפסד
          <select
            value={outcomeFromScore(score)}
            aria-label={`ניצחון או הפסד נגד ${match.opponent}`}
            onChange={(event) => onScore(scoreForOutcome(event.target.value as Outcome, score))}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-sm font-semibold text-ink"
          >
            <option value="" aria-label="ללא הכרעה"></option>
            <option value="win">ניצחון</option>
            <option value="loss">הפסד</option>
          </select>
        </label>
      </div>
      {!allowedScore(score) ? (
        <p className="mt-1 text-xs text-muted">תוצאה קודמת: <bdi>{score}</bdi>. נשמרת עד לבחירה חדשה.</p>
      ) : null}
      <p className="mt-1 text-xs text-muted">
        אנחנו–יריב. בחירת ניצחון מתחילה ב־<bdi>2-1</bdi>, הפסד ב־<bdi>0-3</bdi>; אפשר לשנות בתוצאה.
      </p>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <ActionLink href={wazeUrl(match)} label="ווייז" icon={<Navigation className="size-4" />} />
        <ActionLink href={mapsUrl(match)} label="מפות" icon={<MapPin className="size-4" />} />
        <ActionButton
          label="יומן"
          icon={<CalendarPlus className="size-4" />}
          onClick={() => downloadIcs([match], `bezeq-tennis-match-${match.id}.ics`)}
        />
      </div>
    </li>
  );
}
