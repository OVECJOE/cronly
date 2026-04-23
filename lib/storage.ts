export interface SavedExpression {
  id: string;
  expr: string;
  description: string;
  label: string;
  createdAt: string;
  useCount: number;
}

const KEY = "cronly_history";

export function saveExpression(expr: string, description: string, label?: string): SavedExpression {
  const existing = getHistory();
  const dupe = existing.find(e => e.expr === expr);
  if (dupe) {
    dupe.useCount++;
    dupe.label = label || dupe.label;
    localStorage.setItem(KEY, JSON.stringify(existing));
    return dupe;
  }
  const record: SavedExpression = {
    id: `cron_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    expr,
    description,
    label: label || description,
    createdAt: new Date().toISOString(),
    useCount: 1,
  };
  existing.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 100)));
  return record;
}

export function getHistory(): SavedExpression[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}

export function deleteExpression(id: string) {
  const existing = getHistory().filter(e => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(existing));
}

export function exportHistory(): string {
  return JSON.stringify(getHistory(), null, 2);
}

export function importHistory(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data)) {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    }
    return false;
  } catch { return false; }
}
