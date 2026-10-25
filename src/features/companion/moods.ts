export const COMPANION_MOODS = [
  "relaxed",
  "happy",
  "curious",
  "sleepy",
  "encouraging",
  "proud",
  "chef",
] as const;

export type CompanionMood = (typeof COMPANION_MOODS)[number];

export const DEFAULT_COMPANION_MOOD: CompanionMood = "relaxed";

export const companionMoodLabels: Record<CompanionMood, string> = {
  relaxed: "Relaxed",
  happy: "Happy",
  curious: "Curious",
  sleepy: "Sleepy",
  encouraging: "Encouraging",
  proud: "Proud",
  chef: "Chef",
};
