import type { SQLiteDatabase } from "expo-sqlite";
import type { EatingWindowId } from "../onboarding/eating-windows";

import {
    FOLLOW_UP_SNOOZE_MINUTES,
    getDueFollowUp,
    type DueFollowUp,
    type FollowUpEvent,
    type FollowUpResponse,
    type FollowUpWindow,
} from "./get-due-followup";

type WindowRow = {
  id: EatingWindowId;
  label: string;
  target_minutes: number;
  enabled: number;
};

type EventRow = {
  occurred_at: number;
  eating_window_id: EatingWindowId | null;
};

type ResponseRow = FollowUpResponse;

export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function findDueFollowUp(
  db: SQLiteDatabase,
  now = new Date(),
): Promise<DueFollowUp | null> {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ).getTime();

  const dayKey = localDayKey(now);

  const [windowRows, eventRows, responseRows] = await Promise.all([
    db.getAllAsync<WindowRow>(
      `SELECT id, label, target_minutes, enabled
         FROM eating_windows`,
    ),

    db.getAllAsync<EventRow>(
      `SELECT occurred_at, eating_window_id
         FROM eating_events
         WHERE occurred_at >= ?
           AND occurred_at < ?`,
      start,
      end,
    ),

    db.getAllAsync<ResponseRow>(
      `SELECT window_id, status, next_prompt_at
         FROM eating_followups
         WHERE day_key = ?`,
      dayKey,
    ),
  ]);

  const windows: FollowUpWindow[] = windowRows.map((row) => ({
    id: row.id,
    label: row.label,
    targetMinutes: row.target_minutes,
    enabled: row.enabled === 1,
  }));

  const events: FollowUpEvent[] = eventRows;

  return getDueFollowUp({
    now,
    windows,
    events,
    responses: responseRows,
  });
}

export type FollowUpAction = "NOT_YET" | "DISMISSED" | "SNOOZED";

export async function saveFollowUpResponse(
  db: SQLiteDatabase,
  windowId: EatingWindowId,
  action: FollowUpAction,
  now = new Date(),
): Promise<void> {
  const nowMs = now.getTime();
  const nextPromptAt =
    action === "SNOOZED" ? nowMs + FOLLOW_UP_SNOOZE_MINUTES * 60_000 : null;

  await db.runAsync(
    `INSERT INTO eating_followups (
       day_key,
       window_id,
       status,
       next_prompt_at,
       updated_at
     )
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(day_key, window_id) DO UPDATE SET
       status = excluded.status,
       next_prompt_at = excluded.next_prompt_at,
       updated_at = excluded.updated_at`,
    localDayKey(now),
    windowId,
    action,
    nextPromptAt,
    nowMs,
  );
}
