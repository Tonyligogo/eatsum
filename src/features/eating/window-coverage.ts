import type { EatingWindowId } from "../onboarding/eating-windows";

type WindowRecord = {
  id: EatingWindowId;
  enabled: boolean;
};

type EatingRecord = {
  eating_window_id: EatingWindowId | null;
};

export type WindowCoverage = {
  target: number;
  completed: number;
  completedWindowIds: EatingWindowId[];
  remainingWindowIds: EatingWindowId[];
  status: "complete" | "partial" | "empty";
};

export function calculateWindowCoverage(
  windows: WindowRecord[],
  events: EatingRecord[],
): WindowCoverage {
  const enabledIds = new Set(
    windows.filter((window) => window.enabled).map((window) => window.id),
  );

  const completedIds = new Set<EatingWindowId>();

  for (const event of events) {
    const windowId = event.eating_window_id;

    if (windowId !== null && enabledIds.has(windowId)) {
      completedIds.add(windowId);
    }
  }

  const completedWindowIds = [...completedIds];

  const remainingWindowIds = [...enabledIds].filter(
    (id) => !completedIds.has(id),
  );

  const target = enabledIds.size;
  const completed = completedWindowIds.length;

  let status: WindowCoverage["status"] = "empty";

  if (target > 0 && completed === target) {
    status = "complete";
  } else if (completed > 0) {
    status = "partial";
  }

  return {
    target,
    completed,
    completedWindowIds,
    remainingWindowIds,
    status,
  };
}
