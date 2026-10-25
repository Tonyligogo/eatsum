import type { EatingWindowId } from "../onboarding/eating-windows";
import type { CompanionMood } from "./moods";

export type CompanionWindow = {
  id: EatingWindowId;
  label: string;
  targetMinutes: number;
  enabled: boolean;
};

export type CompanionState = {
  mood: CompanionMood;
  message: string;
  reason:
    | "recent-check-in"
    | "upcoming-meal"
    | "meal-window"
    | "gentle-reminder"
    | "evening"
    | "idle";
};

type CompanionInput = {
  now: Date;
  windows: CompanionWindow[];
  eatingTimes: number[];
};

const MINUTE = 60_000;
const RECENT_CHECK_IN = 45 * MINUTE;
const UPCOMING_WINDOW = 30;
const END_OF_WINDOW = 90;

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function getCompanionState({
  now,
  windows,
  eatingTimes,
}: CompanionInput): CompanionState {
  const nowMs = now.getTime();
  const dayStart = startOfLocalDay(now);

  const todayEvents = eatingTimes
    .filter((time) => time >= dayStart && time <= nowMs)
    .sort((a, b) => b - a);

  const lastEating = todayEvents[0];

  // A recent check-in takes priority over meal prompts.
  if (lastEating !== undefined && nowMs - lastEating < RECENT_CHECK_IN) {
    return {
      mood: "happy",
      message: "Nice one, chef! Hope that hit the spot. 💜",
      reason: "recent-check-in",
    };
  }

  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const activeWindows = windows
    .filter((window) => window.enabled)
    .sort((a, b) => a.targetMinutes - b.targetMinutes);

  for (const window of activeWindows) {
    const difference = minutesNow - window.targetMinutes;

    // Avoid treating an existing meal check-in as a
    // missed window. An occasion can be logged
    // 30 minutes before the configured time.
    const windowStart =
      dayStart + (window.targetMinutes - UPCOMING_WINDOW) * MINUTE;

    const windowEnd =
      dayStart + (window.targetMinutes + END_OF_WINDOW) * MINUTE;

    const alreadyCheckedIn = todayEvents.some(
      (time) => time >= windowStart && time <= windowEnd,
    );

    if (alreadyCheckedIn) continue;

    if (difference >= -UPCOMING_WINDOW && difference < 0) {
      return {
        mood: "curious",
        message: `${window.label} is coming up. Anything tasty on your mind? 👀`,
        reason: "upcoming-meal",
      };
    }

    if (difference >= 0 && difference <= 30) {
      return {
        mood: "curious",
        message: `It's around your ${window.label.toLowerCase()} time. Fancy something?`,
        reason: "meal-window",
      };
    }

    if (difference > 30 && difference <= END_OF_WINDOW) {
      return {
        mood: "encouraging",
        message: `How's your day going? There's always room for a little food break. 💜`,
        reason: "gentle-reminder",
      };
    }
  }

  if (minutesNow >= 21 * 60 || minutesNow < 5 * 60) {
    return {
      mood: "sleepy",
      message: "Long day? Hope you get some good rest. 🌙",
      reason: "evening",
    };
  }

  return {
    mood: "relaxed",
    message:
      todayEvents.length > 0
        ? "Hey, chef! What shall we get up to next?"
        : "Hey, chef! What's on the menu today?",
    reason: "idle",
  };
}
