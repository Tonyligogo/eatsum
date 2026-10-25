import type { EatingWindowId } from "../onboarding/eating-windows";

export type FollowUpWindow = {
  id: EatingWindowId;
  label: string;
  targetMinutes: number;
  enabled: boolean;
};

export type FollowUpEvent = {
  occurred_at: number;
  eating_window_id: EatingWindowId | null;
};

export type FollowUpResponse = {
  window_id: EatingWindowId;
  status: "SNOOZED" | "NOT_YET" | "DISMISSED";
  next_prompt_at: number | null;
};

export type DueFollowUp = {
  windowId: EatingWindowId;
  label: string;
  targetMinutes: number;
  snoozedBefore: boolean;
};

export const FOLLOW_UP_DELAY_MINUTES = 60;
export const FOLLOW_UP_SNOOZE_MINUTES = 45;

export function getDueFollowUp({
  now,
  windows,
  events,
  responses,
}: {
  now: Date;
  windows: FollowUpWindow[];
  events: FollowUpEvent[];
  responses: FollowUpResponse[];
}): DueFollowUp | null {
  const nowMs = now.getTime();

  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  // Only consider enabled windows that are already
  // past their target time plus the grace period.
  const eligible = windows
    .filter((window) => window.enabled)
    .map((window) => ({
      ...window,
      dueAt:
        midnight + (window.targetMinutes + FOLLOW_UP_DELAY_MINUTES) * 60_000,
    }))
    .filter((window) => nowMs >= window.dueAt)
    .sort((a, b) => a.dueAt - b.dueAt);

  for (const window of eligible) {
    // An explicit association fulfills this window.
    const recorded = events.some(
      (event) => event.eating_window_id === window.id,
    );

    if (recorded) continue;

    const response = responses.find((item) => item.window_id === window.id);

    // These responses end the prompt for today.
    if (response?.status === "NOT_YET" || response?.status === "DISMISSED") {
      continue;
    }

    if (response?.status === "SNOOZED") {
      if (response.next_prompt_at === null || nowMs < response.next_prompt_at) {
        continue;
      }

      return {
        windowId: window.id,
        label: window.label,
        targetMinutes: window.targetMinutes,
        snoozedBefore: true,
      };
    }

    return {
      windowId: window.id,
      label: window.label,
      targetMinutes: window.targetMinutes,
      snoozedBefore: false,
    };
  }

  return null;
}
