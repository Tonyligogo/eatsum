export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  "2xl": 28,
  "3xl": 34,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

export const sizes = {
  buttonHeight: 54,
  inputHeight: 52,
  minimumTouchTarget: 44,
  iconSm: 18,
  iconMd: 24,
  iconLg: 32,
} as const;

export const tokens = {
  spacing,
  radius,
  fontSize,
  fontWeight,
  sizes,
} as const;
