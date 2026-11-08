export type VenueId = "yad" | "hadar";

export type Match = {
  id: number;
  round: number;
  /** ISO date, local Israel evening. */
  date: string;
  day: string;
  opponent: string;
  venue: VenueId;
};

export const VENUES: Record<
  VenueId,
  { short: string; full: string; query: string }
> = {
  yad: {
    short: "יד אליהו",
    full: "מגרש טניס ביד אליהו, תל אביב",
    query: "מגרש טניס יד אליהו תל אביב",
  },
  hadar: {
    short: "הדר יוסף",
    full: "מועדון טניס הדר יוסף",
    query: "מועדון טניס הדר יוסף תל אביב",
  },
};

export const KICKOFF = "19:00";
export const MATCH_HOURS = 2;

/** Sorted by date. Ids stay stable so saved marks still apply. */
export const MATCHES: Match[] = [
  {
    id: 1,
    round: 8,
    date: "2026-12-01",
    day: "יום ג׳",
    opponent: "חב׳ חשמל תא-טניס שדה",
    venue: "yad",
  },
  {
    id: 2,
    round: 11,
    date: "2026-12-24",
    day: "יום ה׳",
    opponent: "בנק לאומי מרכז",
    venue: "yad",
  },
  {
    id: 3,
    round: 12,
    date: "2027-01-12",
    day: "יום ג׳",
    opponent: "כלל ביטוח",
    venue: "yad",
  },
  {
    id: 4,
    round: 10,
    date: "2027-01-28",
    day: "יום ה׳",
    opponent: "משמר-טניס שדה",
    venue: "yad",
  },
  {
    id: 9,
    round: 4,
    date: "2027-02-04",
    day: "יום ה׳",
    opponent: "הראל ביטוח ופיננסים",
    venue: "hadar",
  },
  {
    id: 7,
    round: 2,
    date: "2027-02-10",
    day: "יום ד׳",
    opponent: "קופ״ח מאוחדת 1",
    venue: "hadar",
  },
  {
    id: 8,
    round: 13,
    date: "2027-02-23",
    day: "יום ג׳",
    opponent: "לאומי MAX טניס",
    venue: "yad",
  },
  {
    id: 6,
    round: 9,
    date: "2027-03-21",
    day: "יום א׳",
    opponent: "אל-על טניס שדה",
    venue: "yad",
  },
  {
    id: 5,
    round: 3,
    date: "2027-04-01",
    day: "יום ה׳",
    opponent: "רשות שדות התעופה - טניס",
    venue: "hadar",
  },
  {
    id: 10,
    round: 5,
    date: "2027-04-20",
    day: "יום ג׳",
    opponent: "פלאפון א׳",
    venue: "hadar",
  },
  {
    id: 11,
    round: 6,
    date: "2027-06-09",
    day: "יום ד׳",
    opponent: "מגדל חברה לביטוח",
    venue: "hadar",
  },
  {
    id: 12,
    round: 7,
    date: "2027-07-01",
    day: "יום ה׳",
    opponent: "בנק דיסקונט א׳",
    venue: "hadar",
  },
];
