import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { ThemeProvider, useTheme } from "../theme";

import { EatSumNotificationController } from "@/features/notifications/EatSumNotificationController";
import { migrateDatabase } from "../lib/database/migrations";

void SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  fade: true,
  duration: 350,
});

function AppNavigator() {
  const { colors, isDark } = useTheme();

  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    if (!layoutReady) return;

    void SplashScreen.hideAsync();
  }, [layoutReady]);

  const handleLayout = useCallback(() => {
    setLayoutReady(true);
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
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
    </View>
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
        <EatSumNotificationController />
      </SQLiteProvider>
    </ThemeProvider>
  );
}
