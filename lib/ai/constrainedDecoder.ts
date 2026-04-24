/**
 * Cron expression validator and normaliser.
 *
 * Supports:
 *  - Standard 5-field Unix cron  (minute hour dom month dow)
 *  - @nickname shortcuts          (@daily, @hourly, @weekly, @monthly, @yearly, @annually, @midnight, @reboot)
 *  - Quartz 6-field detection     (seconds prefix auto-stripped)
 *  - "L" (last day of month) in dom field
 *  - Step (*\/N, N\/S), range (N-M), and list (N,M) expressions in every field
 */

// ─── Field bounds ─────────────────────────────────────────────────────────────

const FIELD_BOUNDS: Record<string, { min: number; max: number; name: string }> = {
  minute: { min: 0, max: 59, name: "Minute" },
  hour:   { min: 0, max: 23, name: "Hour" },
  dom:    { min: 1, max: 31, name: "Day-of-month" },
  month:  { min: 1, max: 12, name: "Month" },
  dow:    { min: 0, max: 7,  name: "Day-of-week" },  // 0 and 7 both = Sunday
};

// ─── @nickname mapping ────────────────────────────────────────────────────────

const NICKNAMES: Record<string, string> = {
  "@yearly":   "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly":  "0 0 1 * *",
  "@weekly":   "0 0 * * 0",
  "@daily":    "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly":   "0 * * * *",
  "@reboot":   "@reboot",  // special — caller must handle
};

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid:   boolean;
  errors:  string[];
  /** Set when the input was a valid @nickname that was expanded */
  expanded?: string;
  /** Set when a 6-field Quartz expression had its seconds field stripped */
  strippedSeconds?: boolean;
}

// ─── Internal field validator ─────────────────────────────────────────────────

function validateField(
  field:    string,
  bounds:   { min: number; max: number; name: string },
): string | null {  // returns error message or null
  if (field === "*" || field === "?") return null;
  if (field === "L" && bounds.name === "Day-of-month") return null;

  // Step: */N or N/S
  const slashIdx = field.indexOf("/");
  if (slashIdx !== -1) {
    const base = field.slice(0, slashIdx);
    const step = field.slice(slashIdx + 1);
    const stepN = parseInt(step, 10);
    if (isNaN(stepN) || stepN < 1)
      return `${bounds.name}: step "${step}" must be a positive integer`;
    if (stepN > bounds.max - bounds.min)
      return `${bounds.name}: step ${stepN} exceeds field range`;
    if (base !== "*") {
      const baseN = parseInt(base, 10);
      if (isNaN(baseN) || baseN < bounds.min || baseN > bounds.max)
        return `${bounds.name}: base value ${baseN} out of range [${bounds.min}-${bounds.max}]`;
    }
    return null;
  }

  // List: validate each element
  for (const part of field.split(",")) {
    const dashIdx = part.indexOf("-");
    if (dashIdx > 0) {
      const lo = parseInt(part.slice(0, dashIdx), 10);
      const hi = parseInt(part.slice(dashIdx + 1), 10);
      if (isNaN(lo) || isNaN(hi))
        return `${bounds.name}: invalid range "${part}"`;
      if (lo > hi)
        return `${bounds.name}: range start (${lo}) exceeds end (${hi})`;
      if (lo < bounds.min || hi > bounds.max)
        return `${bounds.name}: range ${lo}-${hi} outside [${bounds.min}-${bounds.max}]`;
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n))
        return `${bounds.name}: "${part}" is not a valid integer`;
      if (n < bounds.min || n > bounds.max)
        return `${bounds.name}: ${n} out of range [${bounds.min}-${bounds.max}]`;
    }
  }
  return null;
}

// ─── Public validator ─────────────────────────────────────────────────────────

/**
 * Validate a cron expression (5-field, @nickname, or 6-field Quartz).
 *
 * When a 6-field Quartz expression is detected the seconds field is silently
 * stripped and validation continues on the remaining 5 fields.
 */
export function validateCronStrict(input: string): ValidationResult {
  const errors: string[] = [];
  let strippedSeconds = false;

  const trimmed = input.trim();

  // ── @nickname ───────────────────────────────────────────────────────────────
  const nick = NICKNAMES[trimmed.toLowerCase()];
  if (nick !== undefined) {
    if (nick === "@reboot") {
      return {
        valid:  false,
        errors: ["@reboot is not a repeating schedule and cannot be evaluated as a cron expression."],
        expanded: nick,
      };
    }
    return { valid: true, errors: [], expanded: nick };
  }

  let expr = trimmed;

  // ── Quartz 6-field detection ────────────────────────────────────────────────
  const fields = expr.split(/\s+/);
  if (fields.length === 6) {
    // Assume first field is seconds (0-59); strip it.
    expr = fields.slice(1).join(" ");
    strippedSeconds = true;
  } else if (fields.length !== 5) {
    return {
      valid:  false,
      errors: [`Expected 5 fields (or 6-field Quartz), got ${fields.length}.`],
    };
  }

  const [minute, hour, dom, month, dow] = expr.split(/\s+/);

  const fieldDefs: [string, keyof typeof FIELD_BOUNDS][] = [
    [minute, "minute"],
    [hour,   "hour"],
    [dom,    "dom"],
    [month,  "month"],
    [dow,    "dow"],
  ];

  for (const [value, key] of fieldDefs) {
    const err = validateField(value, FIELD_BOUNDS[key]);
    if (err) errors.push(err);
  }

  return { valid: errors.length === 0, errors, strippedSeconds };
}

// ─── Normaliser ───────────────────────────────────────────────────────────────

/**
 * Attempt to extract a clean 5-field cron expression from raw model/parser output.
 * Handles: leading/trailing whitespace, @nickname expansion, and 6-field Quartz stripping.
 * Returns null if no valid expression can be recovered.
 */
export function normaliseCronOutput(raw: string): string | null {
  const trimmed = raw.trim();

  // @nickname → expand
  const nick = NICKNAMES[trimmed.toLowerCase()];
  if (nick && nick !== "@reboot") return nick;

  const fields = trimmed.split(/\s+/);
  if (fields.length === 6) return fields.slice(1).join(" ");  // strip seconds
  if (fields.length === 5) return trimmed;

  return null;
}

/**
 * Detect whether a string looks like a 6-field Quartz cron expression.
 * Heuristic: exactly 6 whitespace-separated fields where the first is 0-59.
 */
export function isQuartzSixField(input: string): boolean {
  const fields = input.trim().split(/\s+/);
  if (fields.length !== 6) return false;
  const seconds = parseInt(fields[0], 10);
  return !isNaN(seconds) && seconds >= 0 && seconds <= 59;
}
