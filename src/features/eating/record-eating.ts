import type { SQLiteDatabase } from "expo-sqlite";

import type { CreateEatingEventInput, EatingEvent } from "./types";

import type { EatingWindowId } from "../onboarding/eating-windows";

const VALID_WINDOWS: EatingWindowId[] = ["breakfast", "lunch", "dinner"];

type SavedWindowRow = {
  id: string;
  enabled: number;
};

export async function createEatingEvent(
  db: SQLiteDatabase,
  input: CreateEatingEventInput,
): Promise<number> {
  const { category, eatingWindowId, occurredAt, source } = input;

  if (category !== "MEAL" && category !== "SNACK") {
    throw new Error("Invalid eating category.");
  }

  if (
    !Number.isSafeInteger(occurredAt) ||
    occurredAt <= 0 ||
    occurredAt > Date.now()
  ) {
    throw new Error("Invalid eating time.");
  }

  if (source !== "HOME" && source !== "COOKING") {
    throw new Error("Invalid eating source.");
  }

  if (eatingWindowId !== null) {
    if (!VALID_WINDOWS.includes(eatingWindowId)) {
      throw new Error("Invalid eating window.");
    }

    const window = await db.getFirstAsync<SavedWindowRow>(
      `SELECT id, enabled
       FROM eating_windows
       WHERE id = ?`,
      eatingWindowId,
    );

    if (!window || window.enabled !== 1) {
      throw new Error("The selected eating window is not enabled.");
    }
  }

  const result = await db.runAsync(
    `INSERT INTO eating_events (
      occurred_at,
      category,
      source,
      eating_window_id,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)`,
    occurredAt,
    category,
    source,
    eatingWindowId,
    Date.now(),
  );

  return result.lastInsertRowId;
}

export async function getEatingEventsForDay(
  db: SQLiteDatabase,
  date: Date,
): Promise<EatingEvent[]> {
  const dayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();

  const dayEnd = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  ).getTime();

  return db.getAllAsync<EatingEvent>(
    `SELECT
       id,
       occurred_at,
       created_at,
       category,
       source,
       eating_window_id
     FROM eating_events
     WHERE occurred_at >= ?
       AND occurred_at < ?
     ORDER BY occurred_at DESC`,
    dayStart,
    dayEnd,
  );
}

export async function deleteEatingEvent(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid eating record ID.");
  }

  await db.runAsync(`DELETE FROM eating_events WHERE id = ?`, id);
}
