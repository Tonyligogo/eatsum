import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette, radius, useTheme } from "../../theme";

type FloatingTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const tabs = {
  home: {
    label: "Home",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  history: {
    label: "History",
    activeIcon: "calendar",
    inactiveIcon: "calendar-outline",
  },
  settings: {
    label: "Settings",
    activeIcon: "settings",
    inactiveIcon: "settings-outline",
  },
} as const;

type TabName = keyof typeof tabs;

function isTabName(name: string): name is TabName {
  return name in tabs;
}

export function FloatingTabBar({
  state,
  navigateToTab,
  insets,
}: FloatingTabBarProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          bottom: 16,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.3 : 0.12,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        if (!isTabName(route.name)) return null;

        const tab = tabs[route.name];
        const focused = state.index === index;

        const backgroundColor = focused ? palette.purple[600] : "transparent";

        const foregroundColor = focused ? "#FFFFFF" : colors.textMuted;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (!focused) {
                navigateToTab(route.key);
              }
            }}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{
              selected: focused,
            }}
            style={({ pressed }) => [
              styles.tab,
              { backgroundColor },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={focused ? tab.activeIcon : tab.inactiveIcon}
              size={23}
              color={foregroundColor}
            />

            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: foregroundColor,
                  fontWeight: focused ? "700" : "500",
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 76,
    padding: 7,

    flexDirection: "row",
    alignItems: "center",

    borderRadius: radius.full,
    borderWidth: 1,

    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowRadius: 14,
    elevation: 8,
  },

  tab: {
    flex: 1,
    height: 62,
    borderRadius: radius.full,

    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginHorizontal: 2,
  },

  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    includeFontPadding: false,
  },

  pressed: {
    opacity: 0.85,
  },
});
