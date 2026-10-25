import type { EatingWindowId } from "../onboarding/eating-windows";

export type CheckInWindow = {
  id: EatingWindowId;
  label: string;
  targetMinutes: number;
  enabled: boolean;
};

export function suggestEatingWindow(
  date: Date,
  windows: CheckInWindow[],
  maxDistanceMinutes = 90,
): EatingWindowId | null {
  const minutes = date.getHours() * 60 + date.getMinutes();

  const closest = windows
    .filter((window) => window.enabled)
    .map((window) => ({
      id: window.id,
      distance: Math.abs(minutes - window.targetMinutes),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!closest || closest.distance > maxDistanceMinutes) {
    return null;
  }

  return closest.id;
}
