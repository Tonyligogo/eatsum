import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatingTabBar } from "@/components/navigation/FloatingtabBar";
import { useTheme } from "../../theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const androidBottomInset = Platform.OS === "android" ? insets.bottom : 0;

  return (
    <Tabs
      tabBar={(props) => (
        <View
          style={{
            paddingBottom: androidBottomInset,
            backgroundColor: colors.background,
          }}
        >
          <FloatingTabBar {...props} />
        </View>
      )}
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
