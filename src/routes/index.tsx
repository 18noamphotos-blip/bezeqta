import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarPlus,
  Clock,
  MapPin,
  Navigation,
  RotateCcw,
  Share2,
  TriangleAlert,
} from "lucide-react";
import { KICKOFF, MATCHES, VENUES, type Match, type VenueId } from "@/data/matches";
import {
  HOME_KEY,
  STORAGE_KEY,
  dayNum,
  daysUntil,
  downloadIcs,
  dots,
  googleCalendarUrl,
  loadEntries,
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

export const Route = createFileRoute("/")({ component: Home });

const CLASHES = sameDayIds();
type Filter = "all" | "open" | "played";

function Home() {
  const [entries, setEntries] = useState<Entries>({});
  const [home, setHome] = useState<VenueId | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState<Date | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setHome(loadHome());
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!confirmReset) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmReset(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmReset]);

  const played = playedCount(entries);
  const record = recordFrom(entries);
  const upcoming = useMemo(() => nextOpen(entries), [entries]);
  const visible = MATCHES.filter((match) => {
    const isPlayed = Boolean(entries[match.id]?.played);
    if (filter === "played") return isPlayed;
    if (filter === "open") return !isPlayed;
    return true;
  });

  function save(next: Entries) {
    setEntries(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function patch(id: number, partial: Partial<Entries[string]>) {
    const current = entries[id] ?? {};
    save({ ...entries, [id]: { ...current, ...partial } });
  }

  function chooseHome(venue: VenueId | null) {
    setHome(venue);
    if (venue) localStorage.setItem(HOME_KEY, venue);
    else localStorage.removeItem(HOME_KEY);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setEntries({});
    setConfirmReset(false);
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
                      <ActionLink
                        href={googleCalendarUrl(match)}
                        label="יומן"
                        icon={<CalendarPlus className="size-4" />}
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
          <p className="mt-2 text-xs text-muted">מאזן: ניצחונות–תיקו–הפסדים. התוצאה היא אנחנו–יריב, למשל 2-1.</p>
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
                onPlayed={(value) => patch(match.id, { played: value })}
                onScore={(value) =>
                  patch(match.id, {
                    score: value,
                    ...( /^\d+\s*[-:–]\s*\d+$/.test(value.trim()) ? { played: true } : {}),
                  })
                }
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

        <section className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
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
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-hapoel"
            onClick={() => setConfirmReset(true)}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            איפוס סימונים
          </button>
        </section>

        <footer className="mt-6 text-center text-xs leading-relaxed text-muted">
          מחזור 1 הוא פטור, בלי יריבה. הסימונים והתוצאות נשמרים רק במכשיר הזה.
          <br />
          מקור: לוח הליגה למקומות עבודה, הפועל מחוז תל אביב · עונת 2026/27.
        </footer>
      </main>

      {confirmReset ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={() => setConfirmReset(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="reset-title" className="text-lg font-extrabold">
              לאפס את כל הסימונים?
            </h2>
            <p className="mt-2 text-sm text-muted">התוצאות והסימונים יימחקו מהמכשיר הזה. הלוח עצמו יישאר.</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="h-11 flex-1 rounded-xl bg-hapoel text-sm font-semibold text-on-red"
                onClick={resetAll}
              >
                אפס
              </button>
              <button
                type="button"
                className="h-11 flex-1 rounded-xl border border-line text-sm font-semibold"
                onClick={() => setConfirmReset(false)}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

      <div className="mt-3 flex items-center gap-2">
        <label className="inline-flex h-11 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold">
          <input
            type="checkbox"
            className="size-5 accent-hapoel"
            checked={played}
            aria-label={`סמן ששוחק נגד ${match.opponent}`}
            onChange={(event) => onPlayed(event.target.checked)}
          />
          שוחק
        </label>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          dir="ltr"
          value={score}
          placeholder="2-1"
          aria-label={`תוצאה נגד ${match.opponent}, אנחנו מול היריב`}
          onChange={(event) => onScore(event.target.value)}
          className="h-11 w-24 rounded-xl border border-line bg-bg text-center text-base font-semibold"
        />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <ActionLink href={wazeUrl(match)} label="ווייז" icon={<Navigation className="size-4" />} />
        <ActionLink href={mapsUrl(match)} label="מפות" icon={<MapPin className="size-4" />} />
        <ActionLink href={googleCalendarUrl(match)} label="יומן" icon={<CalendarPlus className="size-4" />} />
      </div>
    </li>
  );
}
