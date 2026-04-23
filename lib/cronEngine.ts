/**
 * Cronly cron engine — AI-first, no regex fallback.
 *
 * All natural-language → cron translation goes through ModelManager.
 * Everything else (validation, description, next runs, calendar, output
 * formats) is deterministic and runs synchronously on the main thread.
 */

import { ModelManager } from "./ai/modelManager";
import { validateCronStrict, normaliseCronOutput } from "./ai/constrainedDecoder";

// ─── Re-export types consumers need ──────────────────────────────────────────
export type { ModelPhase, ModelProgress, ProgressCallback } from "./ai/modelManager";
export { validateCronStrict as validateCron };

// ─── Public result type ───────────────────────────────────────────────────────

export interface CronResult {
  expr:        string;
  parts:       CronParts;
  description: string;
  valid:       boolean;
  errors:      string[];
}

export interface CronParts {
  minute:  string;
  hour:    string;
  dom:     string;
  month:   string;
  dow:     string;
}

// ─── Translation (async — goes through model) ─────────────────────────────────

/**
 * Translate a natural-language schedule description to a cron expression.
 *
 * The model runs in a Web Worker — this never blocks the main thread.
 * Typical latency after warm-up: 80-200ms.
 */
export async function translateToCron(input: string): Promise<CronResult> {
  const manager = ModelManager.getInstance();

  // Auto-init if needed (handles edge cases where the component skipped init,
  // or the singleton is in a transient state after a React re-mount).
  if (!manager.isReady) {
    await manager.init();
  }

  const rawOutput = await manager.translate(input.trim());

  // Normalise and validate
  const expr = normaliseCronOutput(rawOutput) ?? rawOutput.trim();
  const { valid, errors } = validateCronStrict(expr);
  const parts = parseParts(expr);

  return {
    expr,
    parts,
    description: valid ? buildDescription(parts) : "",
    valid,
    errors,
  };
}

// ─── Reverse (sync — pure computation) ───────────────────────────────────────

export function cronToEnglish(expr: string): string {
  const parts = parseParts(expr);
  if (!parts) return "Invalid expression";
  return buildDescription(parts);
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

export function parseParts(expr: string): CronParts {
  const [minute = "*", hour = "*", dom = "*", month = "*", dow = "*"] = expr.trim().split(/\s+/);
  return { minute, hour, dom, month, dow };
}

// ─── Human description ────────────────────────────────────────────────────────

const DAY_NAMES   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["","January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

/** Format a 24-hour H + minutes as a 12-hour clock string. */
function fmt(h: number, m: number): string {
  const ampm = h >= 12 ? "pm" : "am";
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

/**
 * Expand a cron field (which may contain ranges and lists) into a sorted
 * array of distinct integer values.
 * e.g.  "1,3-5" → [1,3,4,5]   "2-4" → [2,3,4]   "0" → [0]
 */
function fieldValues(field: string): number[] {
  if (field === "*" || field.startsWith("*/")) return [];
  return [...new Set(
    field.split(",").flatMap(part => {
      const dash = part.indexOf("-");
      if (dash > 0) {
        const lo = parseInt(part.slice(0, dash));
        const hi = parseInt(part.slice(dash + 1));
        return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
      }
      const n = parseInt(part);
      return isNaN(n) ? [] : [n];
    })
  )].sort((a, b) => a - b);
}

/** Join an array of strings with Oxford-comma style. */
function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export function buildDescription({ minute, hour, dom, month, dow }: CronParts): string {
  const parts: string[] = [];

  // ── Decode field types ──────────────────────────────────────────────────────
  const minStep  = minute.startsWith("*/") ? parseInt(minute.slice(2)) : null;
  const hrStep   = hour.startsWith("*/")   ? parseInt(hour.slice(2))   : null;
  const hrDash   = !hour.includes(",") && hour.includes("-");
  const hrComma  = hour.includes(",");

  // ── 1. Fully wildcarded ─────────────────────────────────────────────────────
  if (minute === "*" && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return "every minute";
  }

  // ── 2. Time description ─────────────────────────────────────────────────────

  // Minute step (*/N in minute field)
  if (minStep !== null) {
    const label = minStep === 1 ? "every minute" : `every ${minStep} minutes`;

    if (hrDash) {
      // "*/N H1-H2" — interval within a window
      const [from, to] = hour.split("-").map(Number);
      parts.push(`${label} between ${fmt(from, 0)} and ${fmt(to, 0)}`);
    } else if (hrStep !== null) {
      // Unusual combo (*/N */M) — just state the minute freq
      parts.push(label);
    } else if (hour !== "*" && !hrComma) {
      // Interval during a single specific hour e.g. "*/15 9 * * *"
      parts.push(`${label} past ${fmt(parseInt(hour), 0)}`);
    } else {
      parts.push(label);
    }
  }

  // Hour step (0 */N)
  else if (hrStep !== null) {
    const min = parseInt(minute);
    const m   = isNaN(min) ? 0 : min;
    if (hrStep === 1) {
      parts.push(m === 0 ? "every hour" : `every hour at :${String(m).padStart(2, "0")}`);
    } else {
      parts.push(m === 0 ? `every ${hrStep} hours` : `every ${hrStep} hours at :${String(m).padStart(2, "0")}`);
    }
  }

  // Hour range (M H1-H2)
  else if (hrDash) {
    const [from, to] = hour.split("-").map(Number);
    const min = parseInt(minute);
    const m   = isNaN(min) ? 0 : min;
    parts.push(`between ${fmt(from, m)} and ${fmt(to, m)}`);
  }

  // Multiple hours (M H1,H2,…)
  else if (hrComma) {
    const min   = parseInt(minute);
    const m     = isNaN(min) ? 0 : min;
    const times = hour.split(",").map(h => fmt(parseInt(h), m));
    parts.push(`at ${joinList(times)}`);
  }

  // Wildcard hour, specific minute — "0 * * * *" = every hour; "30 * * * *" = at :30 past each hour
  else if (hour === "*" && minute !== "*") {
    const min = parseInt(minute);
    if (!isNaN(min)) {
      if (min === 0) parts.push("every hour");
      else           parts.push(`at :${String(min).padStart(2, "0")} past each hour`);
    }
  }

  // Specific hour + minute
  else if (hour !== "*") {
    const min = parseInt(minute);
    parts.push(`at ${fmt(parseInt(hour), isNaN(min) ? 0 : min)}`);
  }

  // ── 3. Day-of-week ──────────────────────────────────────────────────────────

  const hasDayConstraint = dow !== "*" || (dom !== "*" && !dom.startsWith("*/"));

  if (dow === "1-5") {
    parts.push("every weekday");
  } else if (dow === "0,6" || dow === "6,0") {
    parts.push("every weekend");
  } else if (dow !== "*") {
    const nums  = fieldValues(dow);
    const names = nums.map(d => DAY_NAMES[d % 7]).filter(Boolean);
    // Contiguous range → "Monday through Friday"
    const isRange = nums.length > 2 &&
      nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    if (isRange) {
      parts.push(`${names[0]} through ${names.at(-1)}`);
    } else {
      parts.push(`every ${joinList(names)}`);
    }
  }

  // ── 4. Day-of-month (only when DOW is unconstrained) ───────────────────────

  if (dow === "*") {
    if (dom === "1") {
      parts.push("on the 1st of each month");
    } else if (dom === "L") {
      parts.push("on the last day of each month");
    } else if (dom.startsWith("*/")) {
      const step = parseInt(dom.slice(2));
      if      (step === 1)  parts.push("every day");
      else if (step === 7)  parts.push("every week");
      else if (step === 14) parts.push("every two weeks");
      else                  parts.push(`every ${step} days`);
    } else if (dom !== "*") {
      const nums   = fieldValues(dom);
      const labels = nums.map(d => `${d}${ordinal(d)}`);
      parts.push(`on the ${joinList(labels)} of each month`);
    } else if (!hasDayConstraint) {
      // No day/DOM constraint at all — add "every day" only for specific times
      // (not when the time description is already a repeating pattern)
      if (minStep === null && hrStep === null && hrDash === false &&
          (hour !== "*" || hrComma)) {
        parts.push("every day");
      }
    }
  }

  // ── 5. Month ────────────────────────────────────────────────────────────────

  if (month !== "*") {
    if (month.startsWith("*/")) {
      const step = parseInt(month.slice(2));
      if (step === 3) parts.push("quarterly");
      else            parts.push(`every ${step} months`);
    } else {
      const nums  = fieldValues(month);
      const names = nums.map(m => MONTH_NAMES[m]).filter(Boolean);
      parts.push(`in ${joinList(names)}`);
    }
  }

  return parts.length ? parts.join(", ") : "custom schedule";
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (v % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

// ─── Next runs (sync) ─────────────────────────────────────────────────────────

export function getNextRuns(expr: string, count = 7): Date[] {
  const { valid } = validateCronStrict(expr);
  if (!valid) return [];

  const [m, h, dom, mo, dow] = expr.trim().split(/\s+/);

  const matches = (field: string, value: number, min: number, max: number): boolean => {
    if (field === "*" || field === "?") return true;
    if (field === "L") return true;
    if (field.startsWith("*/")) {
      const step = parseInt(field.slice(2));
      return value % step === 0;
    }
    if (field.includes("-") && !field.includes(",")) {
      const [lo, hi] = field.split("-").map(Number);
      return value >= lo && value <= hi;
    }
    const values = field.split(",").flatMap(v =>
      v.includes("-") ? range(parseInt(v.split("-")[0]), parseInt(v.split("-")[1])) : [parseInt(v)]
    );
    return values.includes(value);
  };

  const runs: Date[] = [];
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  for (let tries = 0; tries < 525_600 && runs.length < count; tries++) {
    if (
      matches(m,   d.getMinutes(),    0,  59) &&
      matches(h,   d.getHours(),      0,  23) &&
      matches(dom, d.getDate(),       1,  31) &&
      matches(mo,  d.getMonth() + 1,  1,  12) &&
      matches(dow, d.getDay(),        0,   7)
    ) {
      runs.push(new Date(d));
    }
    d.setTime(d.getTime() + 60_000);
  }

  return runs;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

// ─── Calendar days (sync) ─────────────────────────────────────────────────────

export function getCalendarDays(expr: string, year: number, month: number): Set<number> {
  const { valid } = validateCronStrict(expr);
  if (!valid) return new Set();

  const [, , domField, moField, dowField] = expr.trim().split(/\s+/);
  const days = new Set<number>();
  const daysInMonth = new Date(year, month, 0).getDate();

  const matchField = (field: string, value: number): boolean => {
    if (field === "*") return true;
    if (field === "L") return value === daysInMonth;
    if (field.startsWith("*/")) return value % parseInt(field.slice(2)) === 0;
    if (field.includes("-") && !field.includes(",")) {
      const [lo, hi] = field.split("-").map(Number);
      return value >= lo && value <= hi;
    }
    return field.split(",").flatMap(v =>
      v.includes("-") ? range(parseInt(v.split("-")[0]), parseInt(v.split("-")[1])) : [parseInt(v)]
    ).includes(value);
  };

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (
      matchField(domField, d) &&
      matchField(moField,  month) &&
      matchField(dowField, date.getDay())
    ) {
      days.add(d);
    }
  }

  return days;
}

// ─── Conflict detection (sync) ────────────────────────────────────────────────

export function detectConflicts(expr1: string, expr2: string, windowMinutes = 1440): Date[] {
  const runs1 = new Set(
    getNextRuns(expr1, windowMinutes)
      .slice(0, windowMinutes)
      .map(d => d.toISOString())
  );
  return getNextRuns(expr2, windowMinutes)
    .slice(0, windowMinutes)
    .filter(d => runs1.has(d.toISOString()));
}

// ─── Output formats (sync) ────────────────────────────────────────────────────

export type OutputFormat =
  | "standard"
  | "quartz"
  | "aws"
  | "k8s"
  | "github"
  | "node"
  | "python"
  | "go";

export function toOutputFormat(expr: string, format: OutputFormat): string {
  const [m, h, dom, mo, dow] = expr.split(" ");

  switch (format) {
    case "standard":
      return expr;
    case "quartz":
      return `0 ${m} ${h} ${dom} ${mo} ${dow === "0" ? "SUN" : dow} *`;
    case "aws":
      return `cron(${m} ${h} ${dom} ${mo} ${dow} *)`;
    case "k8s":
      return `schedule: "${expr}"`;
    case "github":
      return `on:\n  schedule:\n    - cron: '${expr}'`;
    case "node":
      return `const cron = require('node-cron');\n\ncron.schedule('${expr}', () => {\n  // your task here\n});`;
    case "python":
      return (
        `from apscheduler.schedulers.background import BackgroundScheduler\n\n` +
        `scheduler = BackgroundScheduler()\n` +
        `scheduler.add_job(\n` +
        `    your_function,\n` +
        `    'cron',\n` +
        `    minute='${m}',\n` +
        `    hour='${h}',\n` +
        `    day='${dom}',\n` +
        `    month='${mo}',\n` +
        `    day_of_week='${dow}'\n` +
        `)\nscheduler.start()`
      );
    case "go":
      return (
        `import "github.com/robfig/cron/v3"\n\n` +
        `c := cron.New()\n` +
        `c.AddFunc("${expr}", func() {\n` +
        `    // your task here\n` +
        `})\nc.Start()`
      );
  }
}

// ─── Example schedules ────────────────────────────────────────────────────────

export const EXAMPLE_SCHEDULES = [
  "every weekday at 9am",
  "every 15 minutes",
  "every Monday at 8:30am",
  "first day of the month at midnight",
  "every Sunday at 6pm",
  "every day at noon",
  "every hour",
  "every 5 minutes on weekdays",
  "twice a day at 8am and 6pm",
  "every January 1st at midnight",
  "every last day of the month",
  "every 2 hours",
  "quarterly at midnight",
  "every 15 minutes between 9am and 5pm on weekdays",
  "every Friday at 5:30pm",
  "once a week on Sunday at 3am",
];
