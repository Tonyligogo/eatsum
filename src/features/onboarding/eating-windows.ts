export type EatingWindowId = "breakfast" | "lunch" | "dinner";

export type EatingWindow = {
  id: EatingWindowId;
  label: string;
  targetMinutes: number;
  enabled: boolean;
};

export const defaultEatingWindows: EatingWindow[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    targetMinutes: 8 * 60,
    enabled: true,
  },
  {
    id: "lunch",
    label: "Lunch",
    targetMinutes: 13 * 60,
    enabled: true,
  },
  {
    id: "dinner",
    label: "Dinner",
    targetMinutes: 19 * 60,
    enabled: true,
  },
];

export function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(mins).padStart(2, "0")} ${period}`;
}

export function adjustTime(minutes: number, adjustment: number) {
  return (minutes + adjustment + 1440) % 1440;
}
