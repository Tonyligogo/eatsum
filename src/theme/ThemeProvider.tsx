import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useColorScheme, type ColorSchemeName } from "react-native";

import { darkColors, lightColors, type ThemeColors } from "./colors";

import { tokens } from "./tokens";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  colors: ThemeColors;
  tokens: typeof tokens;

  theme: ResolvedTheme;
  preference: ThemePreference;

  setPreference: (value: ThemePreference) => void;

  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): ResolvedTheme {
  if (preference !== "system") {
    return preference;
  }

  return systemScheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? "light";

  // For now, this is an in-memory preference.
  // We'll persist it when implementing Settings.
  const [preference, setPreference] = useState<ThemePreference>("system");

  const theme = resolveTheme(preference, systemScheme);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: theme === "dark" ? darkColors : lightColors,

      tokens,
      theme,
      preference,
      setPreference,
      isDark: theme === "dark",
    }),
    [theme, preference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
