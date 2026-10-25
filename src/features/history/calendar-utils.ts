export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Monday = first day of the week.
export function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const offset = (result.getDay() + 6) % 7;

  result.setDate(result.getDate() - offset);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = startOfDay(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

export function getWeekDays(date: Date): Date[] {
  const first = startOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

export function getMonthDays(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);

  const gridStart = startOfWeek(first);

  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const gridEnd = addDays(startOfWeek(last), 6);

  const count =
    Math.round(
      (startOfDay(gridEnd).getTime() - startOfDay(gridStart).getTime()) /
        86_400_000,
    ) + 1;

  return Array.from({ length: count }, (_, index) => addDays(gridStart, index));
}

export type DayStatus = "complete" | "partial" | "empty";

export function getDayStatus(checkIns: number, target: number): DayStatus {
  if (checkIns <= 0) return "empty";

  if (target > 0 && checkIns >= target) {
    return "complete";
  }

  return "partial";
}

export function formatWeekRange(days: Date[]): string {
  const first = days[0];
  const last = days[6];

  const firstText = first.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const lastText = last.toLocaleDateString("en-US", {
    month:
      first.getMonth() === last.getMonth() &&
      first.getFullYear() === last.getFullYear()
        ? undefined
        : "short",
    day: "numeric",
  });

  return `${firstText} – ${lastText}`;
}
