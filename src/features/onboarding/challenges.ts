export const challenges = [
  {
    id: "busy",
    title: "Work keeps me busy",
  },
  {
    id: "cooking",
    title: "I don't feel like cooking",
  },
  {
    id: "dishes",
    title: "I hate dealing with the dishes",
  },
  {
    id: "ideas",
    title: "I never know what to eat",
  },
  {
    id: "energy",
    title: "I just don't have the energy",
  },
] as const;

export type ChallengeId = (typeof challenges)[number]["id"];
