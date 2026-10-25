import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider, useTheme } from "../theme";

import { migrateDatabase } from "../lib/database/migrations";

function AppNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerStyle: {
            backgroundColor: colors.background,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />

        <Stack.Screen
          name="onboarding/index"
          options={{
            headerShown: false,
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="onboarding/challenges"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="onboarding/eating-times"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="cooking"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SQLiteProvider
        databaseName="eatsum.db"
        onInit={migrateDatabase}
        useSuspense
      >
        <AppNavigator />
      </SQLiteProvider>
    </ThemeProvider>
  );
}
