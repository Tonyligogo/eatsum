import * as Notifications from "expo-notifications";
import type { SQLiteDatabase } from "expo-sqlite";

import {
    PREP_CATEGORY,
    REVIEW_CATEGORY,
    hasNotificationPermission,
    setupNotificationCategories,
    type NotificationWindowId,
} from "./notification-service";

type WindowRow = {
  id: NotificationWindowId;
  label: string;
  target_minutes: number;
  enabled: number;
};

type EventRow = {
  eating_window_id: NotificationWindowId | null;
};

type SnoozeRow = {
  day_key: string;
  window_id: NotificationWindowId;
  remind_at: number;
};

type FollowUpRow = {
  window_id: NotificationWindowId;
  status: "SNOOZED" | "NOT_YET" | "DISMISSED";
};

export const PREPARATION_LEAD_MINUTES = 30;
export const REVIEW_DELAY_MINUTES = 60;
export const PREPARATION_SNOOZE_MINUTES = 20;

// Avoid sending a late-night review.
export const REVIEW_CUTOFF_HOUR = 21;
export const REVIEW_CUTOFF_MINUTE = 30;

const MANAGED_TYPE = "EATSUM_REMINDER";
const PREPARATION_DAYS_AHEAD = 7;

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function atMinutes(day: Date, minutes: number): Date {
  const result = new Date(day.getFullYear(), day.getMonth(), day.getDate());

  result.setMinutes(minutes);
  return result;
}

async function cancelManagedReminders() {
  const pending = await Notifications.getAllScheduledNotificationsAsync();

  for (const reminder of pending) {
    if (reminder.content.data?.managedBy === MANAGED_TYPE) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }
  }
}

async function schedulePreparation(
  window: WindowRow,
  date: Date,
  scheduledAt: Date,
  snoozed: boolean,
) {
  const key = dayKey(date);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${window.label} is coming up, chef! 🍳`,
      body: "How about getting something ready? I'm here with you.",
      sound: "default",
      categoryIdentifier: PREP_CATEGORY,
      data: {
        managedBy: MANAGED_TYPE,
        type: "PREP",
        windowId: window.id,
        dayKey: key,
        snoozed,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledAt,
    },
  });
}

async function scheduleReview(date: Date, at: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "How was your day, chef? 💜",
      body: "A few eating moments aren't recorded yet. Want to catch up?",
      sound: "default",
      categoryIdentifier: REVIEW_CATEGORY,
      data: {
        managedBy: MANAGED_TYPE,
        type: "REVIEW",
        dayKey: dayKey(date),
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });
}

export async function reconcileEatingNotifications(
  db: SQLiteDatabase,
  now = new Date(),
): Promise<void> {
  const preference = await db.getFirstAsync<{
    enabled: number;
  }>(
    `SELECT enabled
     FROM notification_preferences
     WHERE id = 1`,
  );

  const enabled = preference?.enabled === 1;
  const allowed = enabled ? await hasNotificationPermission() : false;

  // Only remove reminders owned by EatSum's scheduler.
  await cancelManagedReminders();

  if (!enabled || !allowed) return;

  await setupNotificationCategories();

  const windows = await db.getAllAsync<WindowRow>(
    `SELECT id, label, target_minutes, enabled
     FROM eating_windows
     WHERE enabled = 1
     ORDER BY target_minutes ASC`,
  );

  if (windows.length === 0) return;

  const nowMs = now.getTime();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const snoozes = await db.getAllAsync<SnoozeRow>(
    `SELECT day_key, window_id, remind_at
     FROM preparation_snoozes`,
  );

  // Fetch today's events once and use them for:
  // - suppressing already-completed preparation reminders
  // - deciding whether an end-of-day review is needed
  const tomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );

  const todayEvents = await db.getAllAsync<EventRow>(
    `SELECT eating_window_id
     FROM eating_events
     WHERE occurred_at >= ?
       AND occurred_at < ?`,
    today.getTime(),
    tomorrow.getTime(),
  );

  const coveredToday = new Set(
    todayEvents
      .map((event) => event.eating_window_id)
      .filter((id): id is NotificationWindowId => id !== null),
  );

  // Fetch today's Home follow-up responses.
  const todayFollowUps = await db.getAllAsync<FollowUpRow>(
    `SELECT window_id, status
   FROM eating_followups
   WHERE day_key = ?`,
    dayKey(today),
  );

  // Windows the user has already acknowledged.
  // Don't ask them about these again in the evening.
  const acknowledgedWindows = new Set(
    todayFollowUps
      .filter(
        (item) => item.status === "DISMISSED" || item.status === "NOT_YET",
      )
      .map((item) => item.window_id),
  );

  // Rolling seven-day schedule.
  // Seven days × three windows = at most 21
  // normal preparation notifications.
  for (let offset = 0; offset < PREPARATION_DAYS_AHEAD; offset++) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + offset,
    );

    const key = dayKey(date);

    for (const window of windows) {
      if (offset === 0 && coveredToday.has(window.id)) {
        continue;
      }

      const snooze = snoozes.find(
        (item) => item.day_key === key && item.window_id === window.id,
      );

      // Once snoozed, the original reminder must
      // never be scheduled again for that day.
      const scheduledAt = snooze
        ? new Date(snooze.remind_at)
        : atMinutes(date, window.target_minutes - PREPARATION_LEAD_MINUTES);

      if (scheduledAt.getTime() <= nowMs) {
        continue;
      }

      await schedulePreparation(window, date, scheduledAt, Boolean(snooze));
    }
  }

  // Only send an end-of-day review if at least one
  // enabled window is neither recorded nor acknowledged.
  const unresolved = windows.some(
    (window) =>
      !coveredToday.has(window.id) && !acknowledgedWindows.has(window.id),
  );

  if (!unresolved) return;

  const finalWindowMinutes = Math.max(
    ...windows.map((window) => window.target_minutes),
  );

  const cutoffMinutes = REVIEW_CUTOFF_HOUR * 60 + REVIEW_CUTOFF_MINUTE;

  const reviewMinutes = Math.min(
    finalWindowMinutes + REVIEW_DELAY_MINUTES,
    cutoffMinutes,
  );

  // Don't send the review before the final eating
  // window. For very late schedules, skip instead.
  if (reviewMinutes <= finalWindowMinutes) return;

  const reviewAt = atMinutes(today, reviewMinutes);

  if (reviewAt.getTime() > nowMs) {
    await scheduleReview(today, reviewAt);
  }
}

export async function setEatingNotificationsEnabled(
  db: SQLiteDatabase,
  enabled: boolean,
) {
  await db.runAsync(
    `INSERT INTO notification_preferences (id, enabled)
     VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET
       enabled = excluded.enabled`,
    enabled ? 1 : 0,
  );

  await reconcileEatingNotifications(db);
}

export async function snoozePreparation(
  db: SQLiteDatabase,
  windowId: NotificationWindowId,
  key: string,
) {
  // Validate day keys rather than trusting raw
  // data coming from a delivered notification.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
  if (key !== dayKey(new Date())) return;

  const existing = await db.getFirstAsync<{
    remind_at: number;
  }>(
    `SELECT remind_at
     FROM preparation_snoozes
     WHERE day_key = ? AND window_id = ?`,
    key,
    windowId,
  );

  // Only one snooze per eating window each day.
  if (existing) return;

  const window = await db.getFirstAsync<{
    enabled: number;
  }>(
    `SELECT enabled
     FROM eating_windows
     WHERE id = ?`,
    windowId,
  );

  if (!window || window.enabled !== 1) return;

  const now = Date.now();

  await db.runAsync(
    `INSERT INTO preparation_snoozes
      (day_key, window_id, remind_at)
     VALUES (?, ?, ?)`,
    key,
    windowId,
    now + PREPARATION_SNOOZE_MINUTES * 60_000,
  );

  await reconcileEatingNotifications(db);
}
