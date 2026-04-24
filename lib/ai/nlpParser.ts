/**
 * Rule-based NLP parser for natural-language → cron expression translation.
 *
 * Works entirely offline. Zero network requests. Instant results.
 *
 * Returns { expr, warnings } where warnings explains any limitations
 * (e.g. patterns that can't be expressed in standard 5-field cron).
 */

// ─── Public result type ────────────────────────────────────────────────────────

export interface NlpResult {
  expr:     string;   // 5-field cron expression
  warnings: string[]; // human-readable caveats, empty when perfect
}

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

// Number words → integers (used throughout the frequency extractors)
const NUM_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1,
  two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, sixty: 60,
};

const NUM_WORD_PATTERN = Object.keys(NUM_WORDS).sort((a, b) => b.length - a.length).join("|");

// DOW / Month alternation patterns for regex
const DOW_PATTERN =
  "(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)";
const MONTH_PATTERN =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

// ─── Numeric word helper ──────────────────────────────────────────────────────

/** Parse a word OR digit string to an integer: "two" → 2, "15" → 15. */
function parseNum(s: string): number | null {
  const key = s.trim().toLowerCase().replace(/-/g, "-");
  if (NUM_WORDS[key] !== undefined) return NUM_WORDS[key];
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/** Regex fragment that matches a numeric word OR digit sequence. */
const N = `(?:\\d+|${NUM_WORD_PATTERN})`;

// ─── Preprocessing ────────────────────────────────────────────────────────────

function preprocess(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/g, "$1")   // ordinals: "1st" → "1"
    .replace(/\ba\.m\.?/g, "am")
    .replace(/\bp\.m\.?/g, "pm")
    .replace(/\bo'?clock\b/g, "")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\b(?:please|kindly|just|run|execute|fire|trigger|schedule)\b/g, " ")
    .replace(/new year's/g, "new year")
    .replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)s\b/g, "$1")
    .replace(/\ba\s+fortnight\b/g, "fortnight")
    // "half past nine" → "9:30am" approximation handled later; keep text as-is
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Time value ───────────────────────────────────────────────────────────────

interface TimeValue { hour: number; minute: number; }

/** Parse one time token: midnight/noon/H:MMam/Ham/HH:MM */
function parseTimeToken(s: string): TimeValue | null {
  s = s.trim().replace(/\s+/g, "");

  if (s === "midnight" || s === "12am") return { hour: 0, minute: 0 };
  if (s === "noon" || s === "midday" || s === "12pm") return { hour: 12, minute: 0 };

  const h24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const h = +h24[1], m = +h24[2];
    if (h <= 23 && m <= 59) return { hour: h, minute: m };
    return null;
  }
  const h12m = s.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (h12m) {
    let h = +h12m[1]; const m = +h12m[2]; const mer = h12m[3].toLowerCase();
    if (m > 59) return null;
    if (mer === "am") { if (h === 12) h = 0; } else { if (h !== 12) h += 12; }
    if (h > 23) return null;
    return { hour: h, minute: m };
  }
  const h12 = s.match(/^(\d{1,2})(am|pm)$/i);
  if (h12) {
    let h = +h12[1]; const mer = h12[2].toLowerCase();
    if (mer === "am") { if (h === 12) h = 0; } else { if (h !== 12) h += 12; }
    if (h > 23) return null;
    return { hour: h, minute: 0 };
  }
  return null;
}

/**
 * Time-of-day keyword → TimeValue.
 * Provides sensible defaults for vague time words.
 */
function resolveTimeOfDay(word: string): TimeValue | null {
  switch (word.toLowerCase()) {
    case "morning":   case "dawn":              return { hour: 9,  minute: 0 };
    case "afternoon": case "lunchtime":
    case "lunch":                               return { hour: 12, minute: 0 };
    case "midafternoon":                        return { hour: 14, minute: 0 };
    case "evening":   case "dusk":              return { hour: 18, minute: 0 };
    case "night":     case "nightly":
    case "midnight":                            return { hour: 0,  minute: 0 };
    case "noon":      case "midday":            return { hour: 12, minute: 0 };
    default:                                    return null;
  }
}

/** "half past N" → N:30, "quarter past N" → N:15, "quarter to N" → (N-1):45 */
function parseRelativeTime(text: string): TimeValue | null {
  const hp = text.match(/\bhalf\s+past\s+(\w+)\b/);
  if (hp) {
    const h = parseNum(hp[1]);
    if (h !== null && h >= 1 && h <= 12) return { hour: h === 12 ? 0 : h, minute: 30 };
  }
  const qp = text.match(/\bquarter\s+past\s+(\w+)\b/);
  if (qp) {
    const h = parseNum(qp[1]);
    if (h !== null && h >= 1 && h <= 12) return { hour: h === 12 ? 0 : h, minute: 15 };
  }
  const qt = text.match(/\bquarter\s+to\s+(\w+)\b/);
  if (qt) {
    const h = parseNum(qt[1]);
    if (h !== null && h >= 1 && h <= 12) {
      const hr = ((h === 12 ? 0 : h) - 1 + 24) % 24;
      return { hour: hr, minute: 45 };
    }
  }
  return null;
}

/** Extract all time values from text, preserving left-to-right order. */
function extractTimes(text: string): TimeValue[] {
  const times: TimeValue[] = [];
  const seen = new Set<string>();
  const push = (t: TimeValue) => {
    const key = `${t.hour}:${t.minute}`;
    if (!seen.has(key)) { seen.add(key); times.push(t); }
  };

  // "half/quarter past/to" takes priority
  const relTime = parseRelativeTime(text);
  if (relTime) { push(relTime); return times; }

  const hasMidnight    = /\bmidnight\b/.test(text);
  const hasNoon        = /\b(?:noon|midday)\b/.test(text);
  const hasNumericTime = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(text) ||
                         /\b\d{1,2}:\d{2}\b/.test(text);

  if (!hasNumericTime && (hasMidnight || hasNoon)) {
    const namedRe = /\b(midnight|noon|midday)\b/g;
    let nm: RegExpExecArray | null;
    while ((nm = namedRe.exec(text)) !== null) {
      push(nm[1] === "midnight" ? { hour: 0, minute: 0 } : { hour: 12, minute: 0 });
    }
    return times;
  }

  const pattern = /\b(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const t = parseTimeToken(m[0].replace(/\s+/g, "").toLowerCase());
    if (t) push(t);
  }
  return times;
}

/** Extract time-of-day from "every morning/evening/night/..." if no explicit time given. */
function extractTimeOfDay(text: string): TimeValue | null {
  const m = text.match(/\b(morning|afternoon|midafternoon|evening|night|nightly|lunchtime|lunch|dawn|dusk|noon|midday|midnight)\b/);
  if (!m) return null;
  return resolveTimeOfDay(m[1]);
}

// ─── Hour range ───────────────────────────────────────────────────────────────

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

// ─── Day-of-week ──────────────────────────────────────────────────────────────

function extractDow(text: string): string | null {
  // Weekday shorthands (including "business day")
  if (/\b(?:weekday|weekdays|business\s+days?|working\s+days?|work\s+days?|mon(?:day)?(?:\s+to|-)\s*fri(?:day)?|monday through friday|work(?:ing)?\s+day|work\s+week|during\s+the\s+work\s+week|monday\s+to\s+friday)\b/.test(text)) {
    return "1-5";
  }
  // Weekend
  if (/\b(?:weekend|weekends|saturday\s+and\s+sunday|sunday\s+and\s+saturday)\b/.test(text)) {
    return "0,6";
  }
  // Range: "monday through wednesday"
  const rangeRe = new RegExp(`\\b(${DOW_PATTERN})\\s+(?:through|to|-)\\s+(${DOW_PATTERN})\\b`, "i");
  const rangeM = text.match(rangeRe);
  if (rangeM) {
    const from = DOW_MAP[rangeM[1].toLowerCase()];
    const to   = DOW_MAP[rangeM[2].toLowerCase()];
    if (from !== undefined && to !== undefined) return `${from}-${to}`;
  }
  // List / single
  const listRe = new RegExp(`\\b(${DOW_PATTERN})(?:\\s*,\\s*${DOW_PATTERN})*(?:\\s*(?:,\\s*)?and\\s+${DOW_PATTERN})?\\b`, "gi");
  const dayNums: number[] = [];
  const seen = new Set<number>();
  let lm: RegExpExecArray | null;
  while ((lm = listRe.exec(text)) !== null) {
    const singleRe = new RegExp(`\\b${DOW_PATTERN}\\b`, "gi");
    let sm: RegExpExecArray | null;
    while ((sm = singleRe.exec(lm[0])) !== null) {
      const d = DOW_MAP[sm[0].toLowerCase()];
      if (d !== undefined && !seen.has(d)) { seen.add(d); dayNums.push(d); }
    }
  }
  if (dayNums.length > 1) return dayNums.sort((a, b) => a - b).join(",");
  if (dayNums.length === 1) return String(dayNums[0]);
  return null;
}

// ─── Nth weekday of month detection (needs Quartz — warn) ─────────────────────

interface NthWeekday { ordinal: number; dow: number; last: boolean; }

/**
 * Detect "first Monday of the month", "last Friday", "3rd Tuesday", etc.
 * Returns the parsed intent.  Caller is responsible for warning the user
 * that standard 5-field cron cannot express this precisely.
 */
function extractNthWeekday(text: string): NthWeekday | null {
  const ORD: Record<string, number> = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  };

  // "last [day] of the month"
  const lastRe = new RegExp(`\\blast\\s+(${DOW_PATTERN})(?:\\s+of\\s+(?:the|each)\\s+month)?\\b`, "i");
  const lastM  = text.match(lastRe);
  if (lastM) {
    const d = DOW_MAP[lastM[1].toLowerCase()];
    if (d !== undefined) return { ordinal: -1, dow: d, last: true };
  }

  // "first/second/third/fourth/Nth [day] of the month"
  const nthRe = new RegExp(
    `\\b(first|second|third|fourth|fifth|1|2|3|4|5)\\s+(${DOW_PATTERN})(?:\\s+of\\s+(?:the|each|every)\\s+month)?\\b`, "i"
  );
  const nthM = text.match(nthRe);
  if (nthM) {
    const ord = ORD[nthM[1].toLowerCase()];
    const d   = DOW_MAP[nthM[2].toLowerCase()];
    if (ord !== undefined && d !== undefined) return { ordinal: ord, dow: d, last: false };
  }
  return null;
}

// ─── Day-of-month ─────────────────────────────────────────────────────────────

function extractDom(text: string): string | null {
  if (/\blast\s+day\s+(?:of\s+(?:the|each)\s+)?month\b/.test(text)) return "L";
  if (/\bevery\s+last\s+day\b/.test(text)) return "L";
  if (/\bfirst\s+day\s+(?:of\s+(?:the|each)\s+)?month\b/.test(text)) return "1";
  const dm = text.match(/\b(?:on\s+)?the\s+(\d{1,2})(?:\s+of\s+(?:each|the|every)\s+month)?\b/);
  if (dm) {
    const n = +dm[1];
    if (n >= 1 && n <= 31) return String(n);
  }
  return null;
}

// ─── Month ────────────────────────────────────────────────────────────────────

function extractMonth(text: string): string | null {
  const mstep = text.match(new RegExp(`\\bevery\\s+(${N})\\s+months?\\b`));
  if (mstep) {
    const n = parseNum(mstep[1]);
    if (n !== null) return `*/${n}`;
  }
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

// ─── Month+Day extraction ─────────────────────────────────────────────────────

interface MonthDay { month: number; dom: number; }

function extractMonthDay(text: string): MonthDay | null {
  const re = new RegExp(`\\b(${MONTH_PATTERN})\\s+(\\d{1,2})\\b`, "i");
  const m = text.match(re);
  if (!m) return null;
  const mo = MONTH_MAP[m[1].toLowerCase()];
  const d  = +m[2];
  if (!mo || d < 1 || d > 31) return null;
  return { month: mo, dom: d };
}

function extractDayOfMonth(text: string): MonthDay | null {
  const re = new RegExp(`\\b(\\d{1,2})\\s+of\\s+(${MONTH_PATTERN})\\b`, "i");
  const m = text.match(re);
  if (!m) return null;
  const d  = +m[1];
  const mo = MONTH_MAP[m[2].toLowerCase()];
  if (!mo || d < 1 || d > 31) return null;
  return { month: mo, dom: d };
}

// ─── Frequency extractors (all accept number words) ──────────────────────────

interface MinuteFreq { n: number; explicit: boolean; }

function extractMinuteFreq(text: string): MinuteFreq | null {
  // Digit version
  const d = text.match(/\bevery\s+(\d+)\s*-?\s*min(?:ute)?s?\b/) ||
            text.match(/\bonce\s+every\s+(\d+)\s*min(?:ute)?s?\b/) ||
            text.match(/\bat\s+every\s+(\d+)\s*-\s*minute\s+interval\b/);
  if (d) return { n: parseInt(d[1], 10), explicit: true };

  // Word version: "every thirty minutes"
  const w = text.match(new RegExp(`\\bevery\\s+(${NUM_WORD_PATTERN})\\s+min(?:ute)?s?\\b`));
  if (w) { const n = parseNum(w[1]); if (n !== null) return { n, explicit: true }; }

  if (/\b(?:every|each|once\s+a)\s+minute\b/.test(text)) return { n: 1, explicit: false };
  return null;
}

function extractHourFreq(text: string): number | null {
  if (/\b(?:every\s+hour|hourly|once\s+an\s+hour|each\s+hour|every\s+hour\s+on\s+the\s+hour)\b/.test(text) &&
      !/every\s+(?:\d+|\w+)\s+hours?/.test(text)) return 1;

  const d = text.match(/\bevery\s+(\d+)\s*h(?:ours?)?\b/) ||
            text.match(/\bonce\s+every\s+(\d+)\s*hours?\b/) ||
            text.match(/\bevery\s+(\d+)\s*-?\s*hour\b/);
  if (d) return parseInt(d[1], 10);

  const w = text.match(new RegExp(`\\bevery\\s+(${NUM_WORD_PATTERN})\\s+hours?\\b`));
  if (w) return parseNum(w[1]);

  return null;
}

function extractDayFreq(text: string): number | null {
  if (/\bevery\s+other\s+day\b/.test(text)) return 2;

  const d = text.match(/\bevery\s+(\d+)\s+days?\b/) ||
            text.match(/\bonce\s+every\s+(\d+)\s+days?\b/);
  if (d) return parseInt(d[1], 10);

  const w = text.match(new RegExp(`\\bevery\\s+(${NUM_WORD_PATTERN})\\s+days?\\b`));
  if (w) return parseNum(w[1]);

  return null;
}

function extractWeekFreq(text: string): number | null {
  if (/\b(?:every\s+fortnight|fortnightly|every\s+other\s+week)\b/.test(text)) return 14;
  if (/\bbiweekly\b/.test(text)) return 14;

  const d = text.match(/\bevery\s+(\d+)\s+weeks?\b/) ||
            text.match(/\bonce\s+every\s+(\d+)\s+weeks?\b/);
  if (d) return parseInt(d[1], 10) * 7;

  const w = text.match(new RegExp(`\\bevery\\s+(${NUM_WORD_PATTERN})\\s+weeks?\\b`));
  if (w) { const n = parseNum(w[1]); if (n !== null) return n * 7; }

  return null;
}

function extractMonthFreq(text: string): number | null {
  if (/\bevery\s+other\s+month\b/.test(text)) return 2;
  if (/\bbimonthly\b/.test(text)) return 2;

  const d = text.match(/\bevery\s+(\d+)\s+months?\b/);
  if (d) return parseInt(d[1], 10);

  const w = text.match(new RegExp(`\\bevery\\s+(${NUM_WORD_PATTERN})\\s+months?\\b`));
  if (w) return parseNum(w[1]);

  return null;
}

// ─── "Twice/thrice" frequency patterns ───────────────────────────────────────

interface MultipleTimesResult { expr: string; }

function extractMultipleTimes(text: string): MultipleTimesResult | null {
  // "twice a day / twice daily" — explicit times are handled in general case
  // This handles the case where NO explicit times are given
  const hasExplicitTime = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(text) ||
                          /\b(?:midnight|noon|midday)\b/.test(text);

  if (hasExplicitTime) return null; // let general case handle it

  const dow = extractDow(text) ?? "*";

  if (/\b(?:twice\s+a\s+day|twice\s+daily|two\s+times\s+a\s+day)\b/.test(text))
    return { expr: `0 0,12 * * ${dow}` };

  if (/\b(?:thrice\s+a\s+day|three\s+times\s+a\s+day|3\s+times\s+a\s+day)\b/.test(text))
    return { expr: `0 0,8,16 * * ${dow}` };

  if (/\b(?:four\s+times\s+a\s+day|4\s+times\s+a\s+day)\b/.test(text))
    return { expr: `0 0,6,12,18 * * ${dow}` };

  if (/\b(?:twice\s+a\s+week|two\s+times\s+a\s+week)\b/.test(text))
    return { expr: `0 0 * * 1,4` };

  if (/\b(?:three\s+times\s+a\s+week|3\s+times\s+a\s+week)\b/.test(text))
    return { expr: `0 0 * * 1,3,5` };

  if (/\b(?:twice\s+a\s+month|two\s+times\s+a\s+month)\b/.test(text))
    return { expr: `0 0 1,15 * *` };

  return null;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

function build(minute: string, hour: string, dom: string, month: string, dow: string): string {
  return `${minute} ${hour} ${dom} ${month} ${dow}`;
}

// ─── @nickname shortcuts ──────────────────────────────────────────────────────

const NICKNAMES: Record<string, string> = {
  "@yearly":    "0 0 1 1 *",
  "@annually":  "0 0 1 1 *",
  "@monthly":   "0 0 1 * *",
  "@weekly":    "0 0 * * 0",
  "@daily":     "0 0 * * *",
  "@midnight":  "0 0 * * *",
  "@hourly":    "0 * * * *",
};

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Translate a natural-language schedule description to a 5-field cron expression.
 * Returns { expr, warnings } where warnings is empty when the translation is exact.
 * Throws with a human-readable message only if the input is completely unintelligible.
 */
export function parseCronFromText(input: string): NlpResult {
  if (!input || !input.trim()) throw new Error("Empty input.");

  const warnings: string[] = [];
  const warn = (msg: string) => { if (!warnings.includes(msg)) warnings.push(msg); };

  const trimmed = input.trim();

  // ── @nickname shortcuts ────────────────────────────────────────────────────
  const nick = NICKNAMES[trimmed.toLowerCase()];
  if (nick) return { expr: nick, warnings };

  const text = preprocess(input);

  // ── @reboot ────────────────────────────────────────────────────────────────
  if (/@reboot\b/.test(text) || /\bat\s+(?:reboot|startup|boot)\b/.test(text)) {
    warn("@reboot schedules run once at system start-up and cannot be represented as a repeating cron expression. Showing '* * * * *' as a placeholder.");
    return { expr: "* * * * *", warnings };
  }

  // ── Nth weekday of month ───────────────────────────────────────────────────
  const nthWd = extractNthWeekday(text);
  if (nthWd) {
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][nthWd.dow];
    const ordLabel = nthWd.last ? "last" : ["","first","second","third","fourth","fifth"][nthWd.ordinal] ?? String(nthWd.ordinal);
    const times  = extractTimes(text);
    const tod    = times.length === 0 ? extractTimeOfDay(text) : null;
    const tv     = times[0] ?? tod ?? { hour: 0, minute: 0 };
    const month  = extractMonth(text) ?? "*";

    warn(
      `"${ordLabel} ${dayName} of the month" can't be expressed in standard 5-field cron. ` +
      `Quartz equivalent: \`0 ${tv.minute} ${tv.hour} ? * ${dayName.slice(0,3).toUpperCase()}${nthWd.last ? "L" : `#${nthWd.ordinal}`}\`. ` +
      `Showing every ${dayName} instead.`
    );
    return { expr: build(String(tv.minute), String(tv.hour), "*", month, String(nthWd.dow)), warnings };
  }

  // ── every other [weekday] ─────────────────────────────────────────────────
  const everyOtherDow = text.match(
    new RegExp(`\\bevery\\s+other\\s+(${DOW_PATTERN})\\b`, "i")
  );
  if (everyOtherDow) {
    const d = DOW_MAP[everyOtherDow[1].toLowerCase()];
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d ?? 0];
    warn(
      `"Every other ${dayName}" (bi-weekly on a specific day) can't be expressed in standard 5-field cron. ` +
      `Showing every ${dayName} instead. Use a wrapper script with \`[ $(date +%V) % 2 -eq 0 ]\` for bi-weekly logic.`
    );
    const times = extractTimes(text);
    const tv    = times[0] ?? { hour: 0, minute: 0 };
    return { expr: build(String(tv.minute), String(tv.hour), "*", "*", String(d ?? 0)), warnings };
  }

  // ── 1. Keyword short-circuits ─────────────────────────────────────────────

  // "every minute"
  if (/^(?:every|each|once\s+a)\s+minute$/.test(text) || text === "run every minute") {
    return { expr: build("*", "*", "*", "*", "*"), warnings };
  }

  // "twice/thrice" patterns (no explicit times)
  const multi = extractMultipleTimes(text);
  if (multi) return { expr: multi.expr, warnings };

  // "quarterly" / "every quarter" / "every 3 months"
  if (/\b(?:quarterly|every\s+quarter)\b/.test(text) || /\bevery\s+3\s+months?\b/.test(text)) {
    const times = extractTimes(text);
    const tv = times[0];
    return {
      expr: tv ? build(String(tv.minute), String(tv.hour), "1", "*/3", "*")
               : build("0", "0", "1", "*/3", "*"),
      warnings,
    };
  }

  // "every N months" / "every other month" / "bimonthly"
  const monthFreq = extractMonthFreq(text);
  if (monthFreq !== null) {
    const times  = extractTimes(text);
    const [mi, hr] = times[0] ? [String(times[0].minute), String(times[0].hour)] : ["0", "0"];
    const wf = extractWeekFreq(text);
    if (wf !== null) return { expr: build(mi, hr, `*/${wf}`, `*/${monthFreq}`, "*"), warnings };
    const df = extractDayFreq(text);
    if (df !== null) return { expr: build(mi, hr, `*/${df}`, `*/${monthFreq}`, "*"), warnings };
    const dom = extractDom(text) ?? "1";
    return { expr: build(mi, hr, dom, `*/${monthFreq}`, "*"), warnings };
  }

  // "weekly" / "once a week" / "every week" (no explicit DOW)
  if (/\b(?:weekly|once\s+a\s+week|every\s+week)\b/.test(text) && !extractDow(text)) {
    const times = extractTimes(text);
    const tv = times[0];
    return {
      expr: tv ? build(String(tv.minute), String(tv.hour), "*", "*", "0")
               : build("0", "0", "*", "*", "0"),
      warnings,
    };
  }

  // "every N weeks" / "fortnightly" / "biweekly"
  const weekFreq = extractWeekFreq(text);
  if (weekFreq !== null) {
    const times = extractTimes(text);
    const dow   = extractDow(text);
    const [mi, hr] = times[0] ? [String(times[0].minute), String(times[0].hour)] : ["0", "0"];
    if (dow) return { expr: build(mi, hr, "*", "*", dow), warnings };
    return { expr: build(mi, hr, `*/${weekFreq}`, "*", "*"), warnings };
  }

  // "monthly" / "every month" / "once a month"
  if (/\b(?:monthly|every\s+month|once\s+a\s+month|once\s+monthly)\b/.test(text)) {
    const dom   = extractDom(text) ?? "1";
    const times = extractTimes(text);
    const tv    = times[0];
    return {
      expr: tv ? build(String(tv.minute), String(tv.hour), dom, "*", "*")
               : build("0", "0", dom, "*", "*"),
      warnings,
    };
  }

  // "annually" / "yearly" / "every year" / "once a year" / "new year"
  const yearKeyword = /\b(?:annually|yearly|every\s+year|once\s+a\s+year|new\s+year)\b/.test(text);

  // "daily" / "every day" / "once a day" (no time, no DOW)
  if (/\b(?:daily|every\s+day|each\s+day|once\s+daily|once\s+a\s+day)\b/.test(text) &&
      !extractTimes(text).length && !extractTimeOfDay(text) && !extractDow(text)) {
    return { expr: build("0", "0", "*", "*", "*"), warnings };
  }

  // "every N days" / "every other day"
  const dayFreq = extractDayFreq(text);
  if (dayFreq !== null) {
    const times = extractTimes(text);
    const dow   = extractDow(text) ?? "*";
    const [mi, hr] = times[0] ? [String(times[0].minute), String(times[0].hour)] : ["0", "0"];
    return { expr: build(mi, hr, `*/${dayFreq}`, "*", dow), warnings };
  }

  // ── 2. Minute frequency ───────────────────────────────────────────────────

  const minFreq = extractMinuteFreq(text);
  if (minFreq !== null) {
    const mField  = (!minFreq.explicit && minFreq.n === 1) ? "*" : `*/${minFreq.n}`;
    const hrRange = extractHourRange(text);
    const hField  = hrRange ? `${hrRange.from}-${hrRange.to}` : "*";
    const dow     = extractDow(text) ?? "*";
    return { expr: build(mField, hField, "*", "*", dow), warnings };
  }

  // ── 3. Hour frequency ─────────────────────────────────────────────────────

  const hrFreq = extractHourFreq(text);
  if (hrFreq !== null) {
    const hField = hrFreq === 1 ? "*" : `*/${hrFreq}`;
    const dow    = extractDow(text) ?? "*";
    return { expr: build("0", hField, "*", "*", dow), warnings };
  }

  // ── 4. General: time + date components ───────────────────────────────────

  // Resolve times (explicit or time-of-day keyword)
  let times = extractTimes(text);
  if (times.length === 0) {
    const tod = extractTimeOfDay(text);
    if (tod) times = [tod];
  }

  let minuteField: string;
  let hourField:   string;

  if (times.length === 0) {
    minuteField = "0";
    hourField   = "0";
  } else if (times.length === 1) {
    minuteField = String(times[0].minute);
    hourField   = String(times[0].hour);
  } else {
    const allSameMin = times.every(t => t.minute === times[0].minute);
    minuteField = allSameMin ? String(times[0].minute) : times.map(t => String(t.minute)).join(",");
    hourField   = times.map(t => String(t.hour)).join(",");
  }

  const monthDay   = extractMonthDay(text) ?? extractDayOfMonth(text);
  const namedMonth = extractMonth(text);
  const domField   = extractDom(text) ?? (monthDay ? String(monthDay.dom) : "*");
  const monthField = monthDay ? String(monthDay.month)
                              : namedMonth ?? (yearKeyword ? "1" : "*");
  const dowField   = extractDow(text) ?? "*";

  if (yearKeyword && monthDay) {
    return { expr: build(minuteField, hourField, String(monthDay.dom), String(monthDay.month), "*"), warnings };
  }
  if (yearKeyword && namedMonth && domField === "*") {
    return { expr: build(minuteField, hourField, "1", namedMonth, "*"), warnings };
  }
  if (yearKeyword && domField === "*") {
    return { expr: build(minuteField, hourField, "1", monthField === "*" ? "1" : monthField, "*"), warnings };
  }

  return { expr: build(minuteField, hourField, domField, monthField, dowField), warnings };
}
