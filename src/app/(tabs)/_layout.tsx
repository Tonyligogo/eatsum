import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/components/navigation/FloatingtabBar";
import { useTheme } from "../../theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
