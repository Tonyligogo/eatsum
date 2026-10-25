import { Redirect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { palette } from "../theme";

type OnboardingStatus = {
  onboarding_completed: number;
};

export default function Index() {
  const db = useSQLiteContext();

  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function checkOnboarding() {
      try {
        const row = await db.getFirstAsync<OnboardingStatus>(
          `SELECT onboarding_completed
           FROM onboarding_preferences
           WHERE id = 1`,
        );

        if (active) {
          setCompleted(row?.onboarding_completed === 1);
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);

        // Avoid redirecting based on an unknown state.
        // We can add a dedicated retry screen later.
      }
    }

    checkOnboarding();

    return () => {
      active = false;
    };
  }, [db]);

  if (completed === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FAF9FF",
        }}
      >
        <ActivityIndicator size="small" color={palette.purple[500]} />
      </View>
    );
  }

  return <Redirect href={completed ? "/(tabs)/home" : "/onboarding"} />;
}
