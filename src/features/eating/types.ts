import type { EatingWindowId } from "../onboarding/eating-windows";

export const EATING_CATEGORIES = ["MEAL", "SNACK"] as const;

export type EatingCategory = (typeof EATING_CATEGORIES)[number];

export type EatingSource = "HOME" | "COOKING";

export type EatingEvent = {
  id: number;
  occurred_at: number;
  created_at: number;
  category: EatingCategory;
  source: string;
  eating_window_id: EatingWindowId | null;
};

export type CreateEatingEventInput = {
  category: EatingCategory;
  eatingWindowId: EatingWindowId | null;
  occurredAt: number;
  source: EatingSource;
};

export const EATING_CATEGORY_LABELS: Record<EatingCategory, string> = {
  MEAL: "Meal",
  SNACK: "Snack",
};
