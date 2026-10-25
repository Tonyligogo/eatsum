export type HistoryEatingWindow = {
  id: string;
  label: string;
  target_minutes: number;
  enabled: number;
};

export type HistoryCheckIn = {
  id: number;
  occurred_at: number;
  category: string;
  source: string;
  eating_window_id: string | null;
};

export type CheckInContent = {
  title: string;
  description: string;
};

function getCategoryText(category: string): string {
  switch (category) {
    case "SNACK":
      return "Snack";
    case "MEAL":
      return "Meal";
    default:
      return "Eating moment";
  }
}

function getTimeOfDay(minutes: number) {
  if (minutes < 5 * 60) return "late-night";
  if (minutes < 11 * 60) return "morning";
  if (minutes < 16 * 60) return "afternoon";
  if (minutes < 21 * 60) return "evening";
  return "late-night";
}

export function getCheckInContent(
  event: HistoryCheckIn,
  windows: HistoryEatingWindow[],
): CheckInContent {
  const date = new Date(event.occurred_at);

  const minutes = date.getHours() * 60 + date.getMinutes();

  const category = getCategoryText(event.category);

  // Use the explicit window saved with this event.
  // Never infer a window from the recorded time.
  const matchedWindow = windows.find(
    (window) => window.id === event.eating_window_id,
  );

  if (matchedWindow) {
    const windowName = matchedWindow.label;

    switch (matchedWindow.id) {
      case "breakfast":
        return {
          title: "Morning fuel ☀️",
          description: `${category} for breakfast.`,
        };

      case "lunch":
        return {
          title: "A little lunch break 💜",
          description: `${category} for lunch.`,
        };

      case "dinner":
        return {
          title: "Dinner-time delight 🌙",
          description: `${category} for dinner.`,
        };

      default:
        return {
          title: "A little food break 💜",
          description: `${category} for ${windowName.toLowerCase()}.`,
        };
    }
  }

  // No meal-window association. Describe only
  // the known category and time of day.
  const timeOfDay = getTimeOfDay(minutes);

  if (event.category === "SNACK") {
    switch (timeOfDay) {
      case "morning":
        return {
          title: "A little morning bite ☀️",
          description: "Morning snack.",
        };

      case "afternoon":
        return {
          title: "Snack break 💜",
          description: "Afternoon snack.",
        };

      case "evening":
        return {
          title: "A little evening treat ✨",
          description: "Evening snack.",
        };

      default:
        return {
          title: "Late-night munchies 🌙",
          description: "Late-night snack.",
        };
    }
  }

  if (event.category === "MEAL") {
    switch (timeOfDay) {
      case "morning":
        return {
          title: "A lovely morning start ☀️",
          description: "Morning meal.",
        };

      case "afternoon":
        return {
          title: "A little afternoon fuel 💜",
          description: "Afternoon meal.",
        };

      case "evening":
        return {
          title: "An evening eating moment ✨",
          description: "Evening meal.",
        };

      default:
        return {
          title: "A late-night bite 🌙",
          description: "Late-night meal.",
        };
    }
  }

  return {
    title: "A little moment for yourself 💜",
    description: "Eating occasion recorded.",
  };
}
