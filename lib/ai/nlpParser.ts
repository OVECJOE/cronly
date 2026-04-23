/**
 * Rule-based NLP parser for natural-language → cron expression translation.
 *
 * Works entirely offline. Zero network requests. Instant results.
 * Covers all patterns present in the training dataset.
 *
 * Architecture: preprocessing → ordered rule pipeline → component assembly.
 */

// ─── Lookup tables ────────────────────────────────────────────────────────────

const DOW_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const MONTH_MAP: Record<string, number> = {
  january: 1,  jan: 1,
  february: 2, feb: 2,
  march: 3,    mar: 3,
  april: 4,    apr: 4,
  may: 5,
  june: 6,     jun: 6,
  july: 7,     jul: 7,
  august: 8,   aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

// DOW abbreviation pattern (for regex alternation)
const DOW_PATTERN =
  "(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)";

// Month name pattern (for regex alternation)
const MONTH_PATTERN =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

// ─── Preprocessing ────────────────────────────────────────────────────────────

function preprocess(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    // Expand ordinal suffixes: "1st" → "1", "22nd" → "22"
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/g, "$1")
    // Normalise "a.m." / "p.m."
    .replace(/\ba\.m\.?/g, "am")
    .replace(/\bp\.m\.?/g, "pm")
    // "o'clock" carries no info — drop it
    .replace(/\bo'?clock\b/g, "")
    // Normalise "&" → "and"
    .replace(/\s*&\s*/g, " and ")
    // Remove purely decorative filler verbs
    .replace(/\b(?:please|kindly|just|run|execute|fire|trigger|schedule)\b/g, " ")
    // "new year's" → "new year"
    .replace(/new year's/g, "new year")
    // Pluralised day names → singular: "mondays" → "monday", "tuesdays" → "tuesday"
    .replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)s\b/g, "$1")
    // "a fortnight" → "fortnight" (remove article)
    .replace(/\ba\s+fortnight\b/g, "fortnight")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Time value ───────────────────────────────────────────────────────────────

interface TimeValue {
  hour:   number; // 0-23
  minute: number; // 0-59
}

/**
 * Parse a single time token.  Handles:
 *   midnight, noon, midday
 *   H:MM  (24-hour)
 *   H:MMam/pm, Ham/pm, H am/pm  (12-hour)
 */
function parseTimeToken(s: string): TimeValue | null {
  s = s.trim().replace(/\s+/g, "");

  if (s === "midnight" || s === "12am") return { hour: 0, minute: 0 };
  if (s === "noon" || s === "midday" || s === "12pm") return { hour: 12, minute: 0 };

  // 24-hour "HH:MM"
  const h24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = +h24[1], m = +h24[2];
    if (h <= 23 && m <= 59) return { hour: h, minute: m };
    return null;
  }

  // 12-hour with minutes: "9:30am", "9:30pm"
  const h12m = s.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (h12m) {
    let h = +h12m[1];
    const m = +h12m[2];
    const mer = h12m[3].toLowerCase();
    if (m > 59) return null;
    if (mer === "am") { if (h === 12) h = 0; }
    else              { if (h !== 12) h += 12; }
    if (h > 23) return null;
    return { hour: h, minute: m };
  }

  // 12-hour without minutes: "9am", "9pm"
  const h12 = s.match(/^(\d{1,2})(am|pm)$/i);
  if (h12) {
    let h = +h12[1];
    const mer = h12[2].toLowerCase();
    if (mer === "am") { if (h === 12) h = 0; }
    else              { if (h !== 12) h += 12; }
    if (h > 23) return null;
    return { hour: h, minute: 0 };
  }

  return null;
}

/**
 * Extract ALL time values from the text.
 * Handles special words first, then scans for H:MM / Ham/pm patterns.
 * Deduplicates by raw token.
 */
function extractTimes(text: string): TimeValue[] {
  const times: TimeValue[] = [];
  const seen = new Set<string>();

  const push = (t: TimeValue) => {
    const key = `${t.hour}:${t.minute}`;
    if (!seen.has(key)) { seen.add(key); times.push(t); }
  };

  // Named time words — preserve text order (matters for comma list in hour field)
  const hasMidnight = /\bmidnight\b/.test(text);
  const hasNoon     = /\b(?:noon|midday)\b/.test(text);
  const hasNumericTime = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(text) ||
                         /\b\d{1,2}:\d{2}\b/.test(text);

  if (!hasNumericTime && (hasMidnight || hasNoon)) {
    // Scan left-to-right so e.g. "noon and midnight" → [12, 0] not [0, 12]
    const namedRe = /\b(midnight|noon|midday)\b/g;
    let nm: RegExpExecArray | null;
    while ((nm = namedRe.exec(text)) !== null) {
      if (nm[1] === "midnight") push({ hour: 0, minute: 0 });
      else                      push({ hour: 12, minute: 0 });
    }
    return times;
  }

  // Numeric patterns — order: "H:MM am/pm" > "H:MM" > "H am/pm"
  const pattern = /\b(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const raw = m[0].replace(/\s+/g, "").toLowerCase();
    const t = parseTimeToken(raw);
    if (t) push(t);
  }

  return times;
}

// ─── Hour range ("between X and Y", "from X to Y") ────────────────────────────

interface HourRange { from: number; to: number; }

function extractHourRange(text: string): HourRange | null {
  const pat = /(?:between|from)\s+([^\s]+(?:\s+(?:am|pm))?)\s+(?:and|to|until)\s+([^\s]+(?:\s+(?:am|pm))?)/i;
  const m = text.match(pat);
  if (!m) return null;

  const t1 = parseTimeToken(m[1].replace(/\s+/g, "").toLowerCase());
  const t2 = parseTimeToken(m[2].replace(/\s+/g, "").toLowerCase());
  if (!t1 || !t2) return null;

  return { from: t1.hour, to: t2.hour };
}

// ─── Day-of-week extraction ───────────────────────────────────────────────────

function extractDow(text: string): string | null {
  // Weekdays shorthand
  if (/\b(?:weekday|weekdays|mon(?:day)?(?:\s+to|-)\s*fri(?:day)?|monday through friday|work(?:ing)?\s+day|work\s+week|during\s+the\s+work\s+week|monday\s+to\s+friday)\b/.test(text)) {
    return "1-5";
  }
  // Weekend shorthand
  if (/\b(?:weekend|weekends|saturday\s+and\s+sunday|sunday\s+and\s+saturday)\b/.test(text)) {
    return "0,6";
  }

  // Range: "monday through wednesday", "tuesday-thursday"
  const rangeRe = new RegExp(
    `\\b(${DOW_PATTERN})\\s+(?:through|to|-)\\s+(${DOW_PATTERN})\\b`, "i"
  );
  const rangeMatch = text.match(rangeRe);
  if (rangeMatch) {
    const from = DOW_MAP[rangeMatch[1].toLowerCase()];
    const to   = DOW_MAP[rangeMatch[2].toLowerCase()];
    if (from !== undefined && to !== undefined) return `${from}-${to}`;
  }

  // List of days: "monday, wednesday, and friday" or "monday and wednesday"
  const listRe = new RegExp(
    `\\b(${DOW_PATTERN})(?:\\s*,\\s*${DOW_PATTERN})*(?:\\s*(?:,\\s*)?and\\s+${DOW_PATTERN})?\\b`, "gi"
  );
  const dayNums: number[] = [];
  const seen = new Set<number>();
  let lm: RegExpExecArray | null;
  while ((lm = listRe.exec(text)) !== null) {
    // Pull individual day names from the match
    const inner = lm[0];
    const singleRe = new RegExp(`\\b${DOW_PATTERN}\\b`, "gi");
    let sm: RegExpExecArray | null;
    while ((sm = singleRe.exec(inner)) !== null) {
      const d = DOW_MAP[sm[0].toLowerCase()];
      if (d !== undefined && !seen.has(d)) { seen.add(d); dayNums.push(d); }
    }
  }
  if (dayNums.length > 1) return dayNums.sort((a, b) => a - b).join(",");
  if (dayNums.length === 1) return String(dayNums[0]);

  return null;
}

// ─── Day-of-month extraction ─────────────────────────────────────────────────

function extractDom(text: string): string | null {
  // "last day of the month"
  if (/\blast\s+day\s+(?:of\s+(?:the|each)\s+)?month\b/.test(text)) return "L";
  // "every last day"
  if (/\bevery\s+last\s+day\b/.test(text)) return "L";
  // "first day of the month"
  if (/\bfirst\s+day\s+(?:of\s+(?:the|each)\s+)?month\b/.test(text)) return "1";
  // "1st of the month", "on the 1st", "the 3rd of each month"
  const domRe = /\b(?:on\s+)?the\s+(\d{1,2})(?:\s+of\s+(?:each|the|every)\s+month)?\b/;
  const dm = text.match(domRe);
  if (dm) {
    const n = +dm[1];
    if (n >= 1 && n <= 31) return String(n);
  }
  // "on the Nth" — already handled above
  return null;
}

// ─── Month extraction ─────────────────────────────────────────────────────────

function extractMonth(text: string): string | null {
  // "quarterly" / "every quarter" / "every 3 months"  →  handled at top level
  // "every N months" with N != 3 — still */N
  const mstep = text.match(/\bevery\s+(\d+)\s+months?\b/);
  if (mstep) return `*/${mstep[1]}`;

  // List of months: "in January and July", "every January, April, July, October"
  const monthRe = new RegExp(`\\b${MONTH_PATTERN}\\b`, "gi");
  const nums: number[] = [];
  const seen = new Set<number>();
  let mm: RegExpExecArray | null;
  while ((mm = monthRe.exec(text)) !== null) {
    const n = MONTH_MAP[mm[0].toLowerCase()];
    if (n !== undefined && !seen.has(n)) { seen.add(n); nums.push(n); }
  }
  if (nums.length > 1) return nums.sort((a, b) => a - b).join(",");
  if (nums.length === 1) return String(nums[0]);

  return null;
}

// ─── Month+Day extraction (e.g., "January 1st", "1st of November") ──────────

interface MonthDay { month: number; dom: number; }

/** "Month Day" — e.g., "January 1", "September 15" */
function extractMonthDay(text: string): MonthDay | null {
  const re = new RegExp(`\\b(${MONTH_PATTERN})\\s+(\\d{1,2})\\b`, "i");
  const m = text.match(re);
  if (!m) return null;
  const mo = MONTH_MAP[m[1].toLowerCase()];
  const d  = +m[2];
  if (!mo || d < 1 || d > 31) return null;
  return { month: mo, dom: d };
}

/** "Day of Month" — e.g., "1 of November", "the 1st of November" */
function extractDayOfMonth(text: string): MonthDay | null {
  const re = new RegExp(`\\b(\\d{1,2})\\s+of\\s+(${MONTH_PATTERN})\\b`, "i");
  const m = text.match(re);
  if (!m) return null;
  const d  = +m[1];
  const mo = MONTH_MAP[m[2].toLowerCase()];
  if (!mo || d < 1 || d > 31) return null;
  return { month: mo, dom: d };
}

// ─── Numeric word helpers ─────────────────────────────────────────────────────

/** Parse integers written as words or digits: "two" → 2, "15" → 15 */
function parseNumber(s: string): number | null {
  const map: Record<string, number> = {
    one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
    ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
    sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20,
    thirty:30, sixty:60,
  };
  const lower = s.trim().toLowerCase();
  if (map[lower] !== undefined) return map[lower];
  const n = parseInt(lower, 10);
  return isNaN(n) ? null : n;
}

// ─── Minute frequency ────────────────────────────────────────────────────────

interface MinuteFreq {
  n:        number;  // the interval value
  explicit: boolean; // true when user specified a literal digit (e.g. "every 1 minute")
}

/**
 * Extract "every N minutes" → {n, explicit}.
 * Returns null if no minute frequency found.
 */
function extractMinuteFreq(text: string): MinuteFreq | null {
  // "every N minutes", "every N mins", "every N-minute interval", "once every N minutes"
  const m =
    text.match(/\bevery\s+(\d+)\s*-?\s*min(?:ute)?s?\b/) ||
    text.match(/\bonce\s+every\s+(\d+)\s*min(?:ute)?s?\b/) ||
    text.match(/\bat\s+every\s+(\d+)\s*-\s*minute\s+interval\b/);
  if (m) return { n: parseInt(m[1], 10), explicit: true };

  // "every minute", "each minute", "once a minute"
  if (/\b(?:every|each|once\s+a)\s+minute\b/.test(text)) {
    return { n: 1, explicit: false };
  }

  return null;
}

// ─── Day interval ("every N days", "every other day") ────────────────────────

/**
 * Returns the day step if the input expresses an N-day frequency.
 * "every other day" → 2, "every 3 days" → 3, "every 14 days" → 14.
 * Returns null if no day-step pattern found.
 */
function extractDayFreq(text: string): number | null {
  if (/\bevery\s+other\s+day\b/.test(text)) return 2;
  const m = text.match(/\bevery\s+(\d+)\s+days?\b/) ||
            text.match(/\bonce\s+every\s+(\d+)\s+days?\b/);
  if (m) return parseInt(m[1], 10);
  return null;
}

// ─── Week interval ("every 2 weeks", "fortnightly", "every N weeks") ─────────

/**
 * Returns the number of days in the week-interval.
 * "every week" is handled by the "weekly" short-circuit above.
 * "every 2 weeks" / "every fortnight" / "fortnightly" → 14 days.
 * Returns null if no week-step pattern found.
 */
function extractWeekFreq(text: string): number | null {
  if (/\b(?:every\s+fortnight|fortnightly|every\s+other\s+week)\b/.test(text)) return 14;
  if (/\bbiweekly\b/.test(text)) return 14;
  const m = text.match(/\bevery\s+(\d+)\s+weeks?\b/) ||
            text.match(/\bonce\s+every\s+(\d+)\s+weeks?\b/);
  if (m) return parseInt(m[1], 10) * 7;
  return null;
}

// ─── Month interval ("every 2 months", "every other month", "bimonthly") ─────

/**
 * Returns the month step.
 * "every other month" / "bimonthly" → 2, "every 4 months" → 4.
 * Returns null if no month-step pattern found.
 *
 * Note: handled separately from extractMonth() because it needs dom="1".
 */
function extractMonthFreq(text: string): number | null {
  if (/\bevery\s+other\s+month\b/.test(text)) return 2;
  if (/\bbimonthly\b/.test(text)) return 2;
  // "every 3 months" is already "quarterly" — handled above, but catch it here too
  const m = text.match(/\bevery\s+(\d+)\s+months?\b/);
  if (m) return parseInt(m[1], 10);
  return null;
}

// ─── Hour frequency ───────────────────────────────────────────────────────────

function extractHourFreq(text: string): number | null {
  // "every hour", "hourly", "once an hour"
  if (/\b(?:every\s+hour|hourly|once\s+an\s+hour|each\s+hour|every\s+hour\s+on\s+the\s+hour)\b/.test(text) &&
      !/every\s+(?:\d+|\w+)\s+hours?/.test(text)) {
    return 1;
  }
  // "every N hours", "every Nh", "every Nhour"
  const m =
    text.match(/\bevery\s+(\d+)\s*h(?:ours?)?\b/) ||
    text.match(/\bonce\s+every\s+(\d+)\s*hours?\b/) ||
    text.match(/\bevery\s+(\d+)\s*-?\s*hour\b/);
  if (m) return parseInt(m[1], 10);

  return null;
}

// ─── Main assembler ───────────────────────────────────────────────────────────

function build(minute: string, hour: string, dom: string, month: string, dow: string): string {
  return `${minute} ${hour} ${dom} ${month} ${dow}`;
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Translate a natural-language schedule description to a 5-field cron expression.
 * Throws with a human-readable message if the input cannot be parsed.
 */
export function parseCronFromText(input: string): string {
  if (!input || !input.trim()) throw new Error("Empty input.");

  const text = preprocess(input);

  // ── 1. Exact / keyword short-circuits ─────────────────────────────────────

  // "every minute" / "once a minute" (no N specified)
  if (/^(?:every|each|once\s+a)\s+minute$/.test(text) ||
      text === "run every minute") {
    return build("*", "*", "*", "*", "*");
  }

  // "quarterly" / "every quarter" / "every 3 months"
  if (/\b(?:quarterly|every\s+quarter)\b/.test(text) ||
      /\bevery\s+3\s+months?\b/.test(text)) {
    const times = extractTimes(text);
    if (times.length === 1) {
      return build(String(times[0].minute), String(times[0].hour), "1", "*/3", "*");
    }
    return build("0", "0", "1", "*/3", "*");
  }

  // "every N months" / "every other month" / "bimonthly"
  const monthFreq = extractMonthFreq(text);
  if (monthFreq !== null) {
    const times    = extractTimes(text);
    const [mi, hr] = times.length === 1
      ? [String(times[0].minute), String(times[0].hour)]
      : ["0", "0"];

    // Combined: "every fortnight of every other month" → week step + month step
    const weekFreqCombined = extractWeekFreq(text);
    if (weekFreqCombined !== null) {
      return build(mi, hr, `*/${weekFreqCombined}`, `*/${monthFreq}`, "*");
    }
    const dayFreqCombined = extractDayFreq(text);
    if (dayFreqCombined !== null) {
      return build(mi, hr, `*/${dayFreqCombined}`, `*/${monthFreq}`, "*");
    }

    const dom = extractDom(text) ?? "1";
    return build(mi, hr, dom, `*/${monthFreq}`, "*");
  }

  // "weekly" / "once a week" / "every week" (no day specified)
  if (/\b(?:weekly|once\s+a\s+week|every\s+week)\b/.test(text) &&
      !extractDow(text)) {
    const times = extractTimes(text);
    if (times.length === 1) {
      return build(String(times[0].minute), String(times[0].hour), "*", "*", "0");
    }
    return build("0", "0", "*", "*", "0");
  }

  // "every N weeks" / "every fortnight" / "fortnightly" / "biweekly"
  // Standard cron has no "nth week" concept — we approximate as every N*7 days.
  // Note: when combined with a DOW, we drop the DOM step (cron can't combine them cleanly).
  const weekFreq = extractWeekFreq(text);
  if (weekFreq !== null) {
    const times    = extractTimes(text);
    const dowField = extractDow(text);
    const [mi, hr] = times.length === 1
      ? [String(times[0].minute), String(times[0].hour)]
      : ["0", "0"];
    // If a specific day-of-week is requested we can only honour the DOW, not the interval
    if (dowField) return build(mi, hr, "*", "*", dowField);
    return build(mi, hr, `*/${weekFreq}`, "*", "*");
  }

  // "monthly" / "every month" / "once a month"
  if (/\b(?:monthly|every\s+month|once\s+a\s+month|once\s+monthly)\b/.test(text)) {
    const dom   = extractDom(text) ?? "1";
    const times = extractTimes(text);
    if (times.length === 1) {
      return build(String(times[0].minute), String(times[0].hour), dom, "*", "*");
    }
    return build("0", "0", dom, "*", "*");
  }

  // "annually" / "yearly" / "every year" / "once a year" / "new year"
  // but not when a specific month/date is given (handled below)
  const yearKeyword = /\b(?:annually|yearly|every\s+year|once\s+a\s+year|new\s+year)\b/.test(text);

  // "daily" / "every day" / "once a day" (no time)
  if (/\b(?:daily|every\s+day|each\s+day|once\s+daily|once\s+a\s+day)\b/.test(text) &&
      !extractTimes(text).length && !extractDow(text)) {
    return build("0", "0", "*", "*", "*");
  }

  // "every N days" / "every other day"
  const dayFreq = extractDayFreq(text);
  if (dayFreq !== null) {
    const times    = extractTimes(text);
    const dowField = extractDow(text) ?? "*";
    const [mi, hr] = times.length === 1
      ? [String(times[0].minute), String(times[0].hour)]
      : ["0", "0"];
    return build(mi, hr, `*/${dayFreq}`, "*", dowField);
  }

  // ── 2. Minute frequency ────────────────────────────────────────────────────

  const minFreq = extractMinuteFreq(text);
  if (minFreq !== null) {
    // "every minute" → "*"; "every 1 minute" (explicit digit) → "*/1"
    const mField   = (!minFreq.explicit && minFreq.n === 1) ? "*" : `*/${minFreq.n}`;
    const hrRange  = extractHourRange(text);
    const hField   = hrRange ? `${hrRange.from}-${hrRange.to}` : "*";
    const dowField = extractDow(text) ?? "*";
    return build(mField, hField, "*", "*", dowField);
  }

  // ── 3. Hour frequency ─────────────────────────────────────────────────────

  const hrFreq = extractHourFreq(text);
  if (hrFreq !== null) {
    const hField   = hrFreq === 1 ? "*" : `*/${hrFreq}`;
    const dowField = extractDow(text) ?? "*";
    return build("0", hField, "*", "*", dowField);
  }

  // ── 4. General case: specific time + optional date components ─────────────

  // Resolve time(s)
  const times = extractTimes(text);

  let minuteField: string;
  let hourField: string;

  if (times.length === 0) {
    // No time given — default to midnight
    minuteField = "0";
    hourField   = "0";
  } else if (times.length === 1) {
    minuteField = String(times[0].minute);
    hourField   = String(times[0].hour);
  } else {
    // Multiple times — e.g., "8am and 6pm" → "0 8,18 * * *"
    const allSameMinute = times.every(t => t.minute === times[0].minute);
    minuteField = allSameMinute ? String(times[0].minute)
                                : times.map(t => String(t.minute)).join(",");
    hourField   = times.map(t => String(t.hour)).join(",");
  }

  // Resolve date components
  // Try "Month Day" extraction first ("January 1st", "1st of November")
  const monthDay   = extractMonthDay(text) ?? extractDayOfMonth(text);
  const namedMonth = extractMonth(text);        // standalone month name (may overlap monthDay)
  const domField   = extractDom(text) ?? (monthDay ? String(monthDay.dom) : "*");
  const monthField = monthDay
    ? String(monthDay.month)
    : namedMonth ?? (yearKeyword ? "1" : "*");
  const dowField   = extractDow(text) ?? "*";

  // Annual pattern with explicit date → lock dom + month
  if (yearKeyword && monthDay) {
    return build(minuteField, hourField, String(monthDay.dom), String(monthDay.month), "*");
  }
  // Annual pattern with just a named month but no day → default dom 1
  if (yearKeyword && namedMonth && domField === "*") {
    return build(minuteField, hourField, "1", namedMonth, "*");
  }
  // "every year" / "new year" — any annual pattern without explicit dom → dom=1
  if (yearKeyword && domField === "*") {
    return build(minuteField, hourField, "1", monthField === "*" ? "1" : monthField, "*");
  }

  return build(minuteField, hourField, domField, monthField, dowField);
}
