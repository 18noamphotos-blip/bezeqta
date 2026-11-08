import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as MapPin, i as Navigation, n as Share2, o as Clock, r as RotateCcw, s as CalendarPlus, t as TriangleAlert } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CVxsAu0x.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VENUES = {
	yad: {
		short: "יד אליהו",
		full: "מגרש טניס ביד אליהו, תל אביב",
		query: "מגרש טניס יד אליהו תל אביב"
	},
	hadar: {
		short: "הדר יוסף",
		full: "מועדון טניס הדר יוסף",
		query: "מועדון טניס הדר יוסף תל אביב"
	}
};
var KICKOFF = "19:00";
/** Sorted by date. Ids stay stable so saved marks still apply. */
var MATCHES = [
	{
		id: 1,
		round: 8,
		date: "2026-12-01",
		day: "יום ג׳",
		opponent: "חב׳ חשמל תא-טניס שדה",
		venue: "yad"
	},
	{
		id: 2,
		round: 11,
		date: "2026-12-24",
		day: "יום ה׳",
		opponent: "בנק לאומי מרכז",
		venue: "yad"
	},
	{
		id: 3,
		round: 12,
		date: "2027-01-12",
		day: "יום ג׳",
		opponent: "כלל ביטוח",
		venue: "yad"
	},
	{
		id: 4,
		round: 10,
		date: "2027-01-28",
		day: "יום ה׳",
		opponent: "משמר-טניס שדה",
		venue: "yad"
	},
	{
		id: 9,
		round: 4,
		date: "2027-02-04",
		day: "יום ה׳",
		opponent: "הראל ביטוח ופיננסים",
		venue: "hadar"
	},
	{
		id: 7,
		round: 2,
		date: "2027-02-10",
		day: "יום ד׳",
		opponent: "קופ״ח מאוחדת 1",
		venue: "hadar"
	},
	{
		id: 8,
		round: 13,
		date: "2027-02-23",
		day: "יום ג׳",
		opponent: "לאומי MAX טניס",
		venue: "yad"
	},
	{
		id: 6,
		round: 9,
		date: "2027-03-21",
		day: "יום א׳",
		opponent: "אל-על טניס שדה",
		venue: "yad"
	},
	{
		id: 5,
		round: 3,
		date: "2027-04-01",
		day: "יום ה׳",
		opponent: "רשות שדות התעופה - טניס",
		venue: "hadar"
	},
	{
		id: 10,
		round: 5,
		date: "2027-04-20",
		day: "יום ג׳",
		opponent: "פלאפון א׳",
		venue: "hadar"
	},
	{
		id: 11,
		round: 6,
		date: "2027-06-09",
		day: "יום ד׳",
		opponent: "מגדל חברה לביטוח",
		venue: "hadar"
	},
	{
		id: 12,
		round: 7,
		date: "2027-07-01",
		day: "יום ה׳",
		opponent: "בנק דיסקונט א׳",
		venue: "hadar"
	}
];
var STORAGE_KEY = "bezeq_tennis_2026_27";
var HOME_KEY = "bezeq_tennis_home_venue";
var HE_MONTHS_LONG = [
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
	"דצמבר"
];
var HE_MONTHS_SHORT = [
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
	"דצמ׳"
];
function loadEntries() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return {};
		return parsed;
	} catch {
		return {};
	}
}
function loadHome() {
	const raw = localStorage.getItem(HOME_KEY);
	if (raw === "yad" || raw === "hadar") return raw;
	return null;
}
function dots(iso) {
	const [y, m, d] = iso.split("-");
	return `${d}.${m}.${y}`;
}
function dayNum(iso) {
	return String(Number(iso.slice(8, 10)));
}
function monthShort(iso) {
	return HE_MONTHS_SHORT[Number(iso.slice(5, 7)) - 1] ?? "";
}
function longDate(iso) {
	return `${Number(iso.slice(8, 10))} ב${HE_MONTHS_LONG[Number(iso.slice(5, 7)) - 1] ?? ""} ${iso.slice(0, 4)}`;
}
/** Israel civil DST: Friday before the last Sunday of March, through the last Sunday of October. */
function jerusalemOffsetHours(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return isIsraelDst(y, m, d) ? 3 : 2;
}
function lastSunday(year, monthIndex) {
	const last = new Date(Date.UTC(year, monthIndex + 1, 0));
	return last.getUTCDate() - last.getUTCDay();
}
function isIsraelDst(year, month, day) {
	if (month < 3 || month > 10) return false;
	if (month > 3 && month < 10) return true;
	if (month === 3) return day >= lastSunday(year, 2) - 2;
	return day < lastSunday(year, 9);
}
function stamp(iso, hour) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d, hour - jerusalemOffsetHours(iso), 0, 0)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function startHour() {
	return Number(KICKOFF.slice(0, 2));
}
function calendarRange(iso) {
	const start = startHour();
	return `${stamp(iso, start)}/${stamp(iso, start + 2)}`;
}
function icsEscape(value) {
	return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function eventTitle(match) {
	return `בזק תא-טניס נגד ${match.opponent}`;
}
function eventDetails(match) {
	const venue = VENUES[match.venue];
	return `מחזור ${match.round} · ${venue.full} · ${KICKOFF} · ליגה למקומות עבודה, הפועל מחוז תל אביב`;
}
function googleCalendarUrl(match) {
	const venue = VENUES[match.venue];
	return `https://calendar.google.com/calendar/render?${new URLSearchParams({
		action: "TEMPLATE",
		text: eventTitle(match),
		dates: calendarRange(match.date),
		details: eventDetails(match),
		location: venue.full
	}).toString()}`;
}
function mapsUrl(match) {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(VENUES[match.venue].query)}`;
}
function wazeUrl(match) {
	return `https://waze.com/ul?q=${encodeURIComponent(VENUES[match.venue].query)}&navigate=yes`;
}
function buildIcs(matches) {
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Bezeq TA Tennis//Schedule//HE",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH"
	];
	for (const match of matches) {
		const venue = VENUES[match.venue];
		lines.push("BEGIN:VEVENT", `UID:bezeq-tennis-2026-${match.id}@schedule`, `DTSTAMP:${stamp(match.date, startHour())}`, `DTSTART:${stamp(match.date, startHour())}`, `DTEND:${stamp(match.date, startHour() + 2)}`, `SUMMARY:${icsEscape(eventTitle(match))}`, `LOCATION:${icsEscape(venue.full)}`, `DESCRIPTION:${icsEscape(eventDetails(match))}`, "END:VEVENT");
	}
	lines.push("END:VCALENDAR");
	return lines.join("\r\n");
}
function downloadIcs(matches, filename) {
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
function parseScore(score) {
	if (!score) return null;
	const match = score.trim().match(/^(\d+)\s*[-:–]\s*(\d+)$/);
	if (!match) return null;
	return {
		us: Number(match[1]),
		them: Number(match[2])
	};
}
function recordFrom(entries) {
	const line = {
		wins: 0,
		draws: 0,
		losses: 0,
		scored: 0
	};
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
function playedCount(entries) {
	return MATCHES.filter((match) => entries[match.id]?.played).length;
}
function sameDayIds() {
	const byDate = /* @__PURE__ */ new Map();
	for (const match of MATCHES) {
		const list = byDate.get(match.date) ?? [];
		list.push(match.id);
		byDate.set(match.date, list);
	}
	const ids = /* @__PURE__ */ new Set();
	for (const list of byDate.values()) if (list.length > 1) list.forEach((id) => ids.add(id));
	return ids;
}
function calendarDay(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return Date.UTC(y, m - 1, d);
}
function daysUntil(iso, now) {
	const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	return Math.round((calendarDay(iso) - today) / 864e5);
}
function whenLabel(iso, now) {
	const days = daysUntil(iso, now);
	if (days === 0) return "היום";
	if (days === 1) return "מחר";
	if (days > 1) return `עוד ${days} ימים`;
	if (days === -1) return "אתמול";
	return `לפני ${Math.abs(days)} ימים`;
}
function whatsAppSeason(entries) {
	const lines = [
		"לוח בזק תא-טניס 2026/27",
		"הפועל מחוז תל אביב · בית ערב 2 · כל המשחקים ב-19:00",
		""
	];
	for (const match of MATCHES) {
		const entry = entries[match.id];
		const score = entry?.score?.trim();
		const mark = entry?.played ? " · שוחק" : "";
		const result = score ? ` · ${score}` : "";
		lines.push(`${dots(match.date)} ${match.day} · מחזור ${match.round} · ${match.opponent} · ${VENUES[match.venue].short}${result}${mark}`);
	}
	return lines.join("\n");
}
function openWhatsApp(text) {
	window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}
function nextOpen(entries) {
	const open = MATCHES.filter((match) => !entries[match.id]?.played);
	if (open.length === 0) return [];
	const first = open[0]?.date;
	return open.filter((match) => match.date === first);
}
var CLASHES = sameDayIds();
function Home() {
	const [entries, setEntries] = (0, import_react.useState)({});
	const [home, setHome] = (0, import_react.useState)(null);
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [now, setNow] = (0, import_react.useState)(null);
	const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setEntries(loadEntries());
		setHome(loadHome());
		setNow(/* @__PURE__ */ new Date());
		const timer = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
		return () => window.clearInterval(timer);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!confirmReset) return;
		const onKey = (event) => {
			if (event.key === "Escape") setConfirmReset(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [confirmReset]);
	const played = playedCount(entries);
	const record = recordFrom(entries);
	const upcoming = (0, import_react.useMemo)(() => nextOpen(entries), [entries]);
	const visible = MATCHES.filter((match) => {
		const isPlayed = Boolean(entries[match.id]?.played);
		if (filter === "played") return isPlayed;
		if (filter === "open") return !isPlayed;
		return true;
	});
	function save(next) {
		setEntries(next);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	}
	function patch(id, partial) {
		const current = entries[id] ?? {};
		save({
			...entries,
			[id]: {
				...current,
				...partial
			}
		});
	}
	function chooseHome(venue) {
		setHome(venue);
		if (venue) localStorage.setItem(HOME_KEY, venue);
		else localStorage.removeItem(HOME_KEY);
	}
	function resetAll() {
		localStorage.removeItem(STORAGE_KEY);
		setEntries({});
		setConfirmReset(false);
	}
	const clashOpen = MATCHES.filter((match) => CLASHES.has(match.id) && !entries[match.id]?.played);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "bg-hapoel text-on-red",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-3xl px-4 pb-16 pt-7",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-on-red/80",
							children: "ליגה למקומות עבודה · הפועל מחוז תל אביב"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-end justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-3xl font-extrabold leading-none tracking-tight sm:text-4xl",
								children: "בזק תא-טניס"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-on-red/15 px-3 py-1 text-sm font-semibold",
								children: "בית ערב 2"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-base text-on-red/90",
							children: "לוח משחקים · עונת 2026/27 · טניס שדה"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 flex items-center gap-1.5 text-sm font-medium text-on-red/80",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
									className: "size-4",
									"aria-hidden": "true"
								}),
								"כל המשחקים בשעה ",
								KICKOFF
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto -mt-10 max-w-3xl px-4 pb-16",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5",
						children: [
							upcoming.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold text-hapoel",
									children: "סוף עונה"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 text-2xl font-extrabold",
									children: "כל 12 המשחקים סומנו"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: "המאזן לפי התוצאות שהוזנו: אנחנו מול היריב."
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-semibold text-hapoel",
										children: "המשחק הבא"
									}), now ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-semibold",
										children: whenLabel(upcoming[0].date, now)
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: dots(upcoming[0].date)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted",
									children: [
										upcoming[0].day,
										" · ",
										longDate(upcoming[0].date),
										now && daysUntil(upcoming[0].date, now) < 0 ? " · התאריך עבר ועדיין לא סומן" : ""
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 flex flex-col gap-3",
									children: upcoming.map((match) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "rounded-xl bg-bg px-3 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs font-semibold text-muted",
													children: ["מחזור ", match.round]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-lg font-extrabold leading-snug",
													children: match.opponent
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 flex items-center gap-1 text-sm text-muted",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
															className: "size-4 shrink-0 text-hapoel",
															"aria-hidden": "true"
														}),
														VENUES[match.venue].full,
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeTag, {
															venue: match.venue,
															home
														})
													]
												})
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "shrink-0 text-lg font-extrabold text-hapoel",
												children: KICKOFF
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 grid grid-cols-3 gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionLink, {
													href: wazeUrl(match),
													label: "ווייז",
													icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "size-4" }),
													primary: true
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionLink, {
													href: mapsUrl(match),
													label: "מפות",
													icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionLink, {
													href: googleCalendarUrl(match),
													label: "יומן",
													icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPlus, { className: "size-4" })
												})
											]
										})]
									}, match.id))
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "שוחקו",
										value: String(played)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "נותרו",
										value: String(MATCHES.length - played)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "מאזן",
										value: record.scored ? `${record.wins}–${record.draws}–${record.losses}` : "—"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 h-1.5 overflow-hidden rounded-full bg-line",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full bg-hapoel",
									style: { width: `${played / MATCHES.length * 100}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted",
								children: "מאזן: ניצחונות–תיקו–הפסדים. התוצאה היא אנחנו–יריב, למשל 2-1."
							})
						]
					}),
					clashOpen.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 flex items-start gap-2 rounded-2xl border border-line bg-hapoel-soft px-4 py-3 text-sm text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
							className: "mt-0.5 size-4 shrink-0 text-hapoel",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"ב-",
							dots(clashOpen[0].date),
							" רשומים ",
							clashOpen.length,
							" משחקים ב-",
							KICKOFF,
							":",
							" ",
							clashOpen.map((match) => `${match.opponent} ב${VENUES[match.venue].short}`).join(", "),
							"."
						] })]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex items-center justify-between gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex rounded-full bg-surface p-1 shadow-sm",
							role: "tablist",
							"aria-label": "סינון משחקים",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterButton, {
									current: filter,
									id: "open",
									count: MATCHES.length - played,
									onSelect: setFilter,
									children: "פתוחים"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterButton, {
									current: filter,
									id: "played",
									count: played,
									onSelect: setFilter,
									children: "שוחקו"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterButton, {
									current: filter,
									id: "all",
									count: MATCHES.length,
									onSelect: setFilter,
									children: "הכל"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 flex flex-col gap-3",
						children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted",
							children: filter === "played" ? "עדיין אין משחקים מסומנים." : "אין משחקים פתוחים."
						}) : visible.map((match) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchCard, {
							match,
							played: Boolean(entries[match.id]?.played),
							score: entries[match.id]?.score ?? "",
							home,
							past: now ? daysUntil(match.date, now) < 0 : false,
							onPlayed: (value) => patch(match.id, { played: value }),
							onScore: (value) => patch(match.id, {
								score: value,
								.../^\d+\s*[-:–]\s*\d+$/.test(value.trim()) ? { played: true } : {}
							})
						}, match.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-xs font-medium text-muted",
						children: "מגרש ביתי — לסימון בית וחוץ על הכרטיסים"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeButton, {
								active: home === "yad",
								onClick: () => chooseHome(home === "yad" ? null : "yad"),
								children: "יד אליהו"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeButton, {
								active: home === "hadar",
								onClick: () => chooseHome(home === "hadar" ? null : "hadar"),
								children: "הדר יוסף"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeButton, {
								active: home === null,
								onClick: () => chooseHome(null),
								children: "בלי סימון"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-hapoel px-3 text-sm font-semibold text-on-red",
								onClick: () => openWhatsApp(whatsAppSeason(entries)),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {
									className: "size-4",
									"aria-hidden": "true"
								}), "שליחה לוואטסאפ"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold",
								onClick: () => downloadIcs(MATCHES, "bezeq-tennis-2026-27.ics"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPlus, {
									className: "size-4",
									"aria-hidden": "true"
								}), "כל העונה ליומן"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-hapoel",
								onClick: () => setConfirmReset(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
									className: "size-4",
									"aria-hidden": "true"
								}), "איפוס סימונים"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
						className: "mt-6 text-center text-xs leading-relaxed text-muted",
						children: [
							"מחזור 1 הוא פטור, בלי יריבה. הסימונים והתוצאות נשמרים רק במכשיר הזה.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"מקור: לוח הליגה למקומות עבודה, הפועל מחוז תל אביב · עונת 2026/27."
						]
					})
				]
			}),
			confirmReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center",
				onClick: () => setConfirmReset(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "reset-title",
					className: "w-full max-w-sm rounded-2xl bg-surface p-5 shadow-sm",
					onClick: (event) => event.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "reset-title",
							className: "text-lg font-extrabold",
							children: "לאפס את כל הסימונים?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "התוצאות והסימונים יימחקו מהמכשיר הזה. הלוח עצמו יישאר."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-xl bg-hapoel text-sm font-semibold text-on-red",
								onClick: resetAll,
								children: "אפס"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 flex-1 rounded-xl border border-line text-sm font-semibold",
								onClick: () => setConfirmReset(false),
								children: "ביטול"
							})]
						})
					]
				})
			}) : null
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xl font-extrabold leading-none",
		children: value
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 text-xs text-muted",
		children: label
	})] });
}
function HomeTag({ venue, home }) {
	if (!home) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "rounded-full bg-hapoel-soft px-2 py-0.5 text-xs font-semibold text-hapoel",
		children: venue === home ? "בית" : "חוץ"
	});
}
function FilterButton({ current, id, count, onSelect, children }) {
	const active = current === id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		role: "tab",
		"aria-selected": active,
		className: `h-10 rounded-full px-3 text-sm font-semibold ${active ? "bg-hapoel text-on-red" : "text-muted"}`,
		onClick: () => onSelect(id),
		children: [
			children,
			" ",
			count
		]
	});
}
function HomeButton({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		onClick,
		className: `h-11 rounded-xl border text-sm font-semibold ${active ? "border-hapoel bg-hapoel-soft text-hapoel" : "border-line bg-surface text-ink"}`,
		children
	});
}
function ActionLink({ href, label, icon, primary = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href,
		target: "_blank",
		rel: "noopener noreferrer",
		className: `inline-flex h-11 cursor-pointer items-center justify-center gap-1 rounded-xl text-sm font-semibold ${primary ? "bg-hapoel text-on-red" : "border border-line bg-surface text-ink"}`,
		children: [icon, label]
	});
}
function MatchCard({ match, played, score, home, past, onPlayed, onScore }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: `rounded-2xl border bg-surface p-3 shadow-sm ${played ? "border-line" : "border-line"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl ${played ? "bg-line text-muted" : "bg-hapoel text-on-red"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xl font-extrabold leading-none",
						children: dayNum(match.date)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 text-xs font-medium",
						children: monthShort(match.date)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-semibold text-muted",
								children: [
									"מחזור ",
									match.round,
									" · ",
									match.day,
									CLASHES.has(match.id) ? " · גם משחק נוסף" : "",
									!played && past ? " · עבר" : ""
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-sm font-extrabold ${played ? "text-muted" : "text-hapoel"}`,
								children: KICKOFF
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `mt-0.5 text-base font-extrabold leading-snug ${played ? "text-muted line-through" : ""}`,
							children: match.opponent
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 flex flex-wrap items-center gap-1 text-sm text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									className: "size-3.5 shrink-0",
									"aria-hidden": "true"
								}),
								VENUES[match.venue].short,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "·"
								}),
								dots(match.date),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeTag, {
									venue: match.venue,
									home
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex h-11 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "size-5 accent-hapoel",
						checked: played,
						"aria-label": `סמן ששוחק נגד ${match.opponent}`,
						onChange: (event) => onPlayed(event.target.checked)
					}), "שוחק"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					inputMode: "text",
					autoComplete: "off",
					dir: "ltr",
					value: score,
					placeholder: "2-1",
					"aria-label": `תוצאה נגד ${match.opponent}, אנחנו מול היריב`,
					onChange: (event) => onScore(event.target.value),
					className: "h-11 w-24 rounded-xl border border-line bg-bg text-center text-base font-semibold"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionLink, {
						href: wazeUrl(match),
						label: "ווייז",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionLink, {
						href: mapsUrl(match),
						label: "מפות",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionLink, {
						href: googleCalendarUrl(match),
						label: "יומן",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPlus, { className: "size-4" })
					})
				]
			})
		]
	});
}
//#endregion
export { Home as component };
