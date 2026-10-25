/**
 * EatSum Color System
 *
 * Primary brand color: #8B5CF6
 * Inspired by the EatSum mascot.
 */

export const palette = {
  purple: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA",
    500: "#8B5CF6",
    600: "#7C3AED",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
  },

  neutral: {
    white: "#FFFFFF",
    50: "#FAF9FF",
    100: "#F5F2FA",
    200: "#E9E5F2",
    400: "#A49BAF",
    500: "#70677E",
    700: "#4B415D",
    900: "#252038",
  },

  peach: "#FFB996",
  mint: "#8DD9B3",
  gold: "#FFD178",

  success: "#21845A",
  warning: "#9B6212",
  error: "#B83E55",
} as const;

/**
 * Light mode semantic colors.
 */

export const lightColors = {
  background: palette.neutral[50],

  surface: palette.neutral.white,
  surfaceSecondary: palette.purple[50],
  surfaceTertiary: palette.purple[100],

  primary: palette.purple[500],
  primaryPressed: palette.purple[700],
  primaryLight: palette.purple[50],

  text: palette.neutral[900],
  textSecondary: palette.neutral[700],
  textMuted: palette.neutral[500],
  textOnPrimary: palette.neutral.white,

  border: palette.neutral[200],
  divider: palette.neutral[200],

  accent: palette.peach,
  positive: palette.mint,
  highlight: palette.gold,

  success: palette.success,
  warning: palette.warning,
  error: palette.error,

  overlay: "rgba(37, 32, 56, 0.48)",
  shadow: "#252038",
} as const;

/**
 * Dark mode semantic colors.
 *
 * Primary is intentionally lighter in dark mode
 * to maintain contrast and readability.
 */

export const darkColors: Record<keyof typeof lightColors, string> = {
  background: "#171222",

  surface: "#241B31",
  surfaceSecondary: "#302440",
  surfaceTertiary: "#403052",

  primary: "#B69AFF",
  primaryPressed: "#CBB7FF",
  primaryLight: "#302440",

  text: "#F7F3FF",
  textSecondary: "#D0C5E0",
  textMuted: "#AFA2BF",
  textOnPrimary: "#241433",

  border: "#443753",
  divider: "#3A2F4A",

  accent: palette.peach,
  positive: palette.mint,
  highlight: palette.gold,

  success: palette.mint,
  warning: palette.gold,
  error: "#FF91A5",

  overlay: "rgba(0, 0, 0, 0.65)",
  shadow: "#000000",
};

export type ThemeColors = Record<keyof typeof lightColors, string>;
