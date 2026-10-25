import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 5;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA journal_mode = WAL;");

  const result = await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version;");

  const version = result?.user_version ?? 0;

  if (version > DATABASE_VERSION) {
    throw new Error("Database version is newer than the app.");
  }

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS eating_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        occurred_at INTEGER NOT NULL,
        category TEXT NOT NULL DEFAULT 'MEAL',
        source TEXT NOT NULL DEFAULT 'HOME',
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_eating_events_time
        ON eating_events(occurred_at);

      PRAGMA user_version = 1;
    `);
  }

  if (version < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS onboarding_preferences (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        challenges TEXT NOT NULL DEFAULT '[]',
        updated_at INTEGER NOT NULL
      );

      PRAGMA user_version = 2;
    `);
  }

  if (version < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS eating_windows (
        id TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        target_minutes INTEGER NOT NULL
          CHECK (target_minutes >= 0 AND target_minutes < 1440),
        enabled INTEGER NOT NULL DEFAULT 1
          CHECK (enabled IN (0, 1)),
        updated_at INTEGER NOT NULL
      );

      ALTER TABLE onboarding_preferences
      ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0;
    `);

      await db.execAsync("PRAGMA user_version = 3;");
    });
  }

  if (version < 4) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(`
      ALTER TABLE eating_events
      ADD COLUMN eating_window_id TEXT
      CHECK (
        eating_window_id IS NULL
        OR eating_window_id IN (
          'breakfast',
          'lunch',
          'dinner'
        )
      );

      CREATE INDEX IF NOT EXISTS
        idx_eating_events_window
      ON eating_events (
        eating_window_id,
        occurred_at
      );

      PRAGMA user_version = 4;
    `);
    });
  }

  if (version < 5) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(`
      CREATE TABLE IF NOT EXISTS eating_followups (
        day_key TEXT NOT NULL,
        window_id TEXT NOT NULL
          CHECK (window_id IN ('breakfast', 'lunch', 'dinner')),
        status TEXT NOT NULL
          CHECK (
            status IN ('SNOOZED', 'NOT_YET', 'DISMISSED')
          ),
        next_prompt_at INTEGER,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (day_key, window_id)
      );

      PRAGMA user_version = 5;
    `);
    });
  }
}
