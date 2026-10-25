import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  palette,
  radius,
  spacing,
  useTheme,
  type ThemePreference,
} from "../../theme";

import {
  adjustTime,
  formatTime,
  type EatingWindowId,
} from "../../features/onboarding/eating-windows";

type EatingWindow = {
  id: EatingWindowId;
  label: string;
  targetMinutes: number;
  enabled: boolean;
};

type EatingWindowRow = {
  id: string;
  label: string;
  target_minutes: number;
  enabled: number;
};

const appearanceOptions: {
  label: string;
  value: ThemePreference;
}[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const defaultWindows: EatingWindow[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    targetMinutes: 8 * 60,
    enabled: true,
  },
  {
    id: "lunch",
    label: "Lunch",
    targetMinutes: 13 * 60,
    enabled: true,
  },
  {
    id: "dinner",
    label: "Dinner",
    targetMinutes: 19 * 60,
    enabled: true,
  },
];

const windowIcons = {
  breakfast: "sunny-outline",
  lunch: "restaurant-outline",
  dinner: "moon-outline",
} as const;

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [windows, setWindows] = useState<EatingWindow[]>([]);

  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState<EatingWindowId | null>(null);

  const loadWindows = useCallback(async () => {
    const rows = await db.getAllAsync<EatingWindowRow>(
      `SELECT id, label, target_minutes, enabled
       FROM eating_windows`,
    );

    const merged = defaultWindows.map((fallback) => {
      const saved = rows.find((row) => row.id === fallback.id);

      if (!saved) return fallback;

      return {
        ...fallback,
        label: saved.label,
        targetMinutes: saved.target_minutes,
        enabled: saved.enabled === 1,
      };
    });

    setWindows(merged);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          const rows = await db.getAllAsync<EatingWindowRow>(
            `SELECT id, label, target_minutes, enabled
               FROM eating_windows`,
          );

          if (!active) return;

          setWindows(
            defaultWindows.map((fallback) => {
              const saved = rows.find((row) => row.id === fallback.id);

              return saved
                ? {
                    ...fallback,
                    label: saved.label,
                    targetMinutes: saved.target_minutes,
                    enabled: saved.enabled === 1,
                  }
                : fallback;
            }),
          );
        } catch (error) {
          console.error(error);

          if (active) {
            Alert.alert("Couldn't load eating times", "Please try again.");
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [db]),
  );

  const updateWindow = async (
    id: EatingWindowId,
    changes: Partial<Pick<EatingWindow, "targetMinutes" | "enabled">>,
  ) => {
    if (savingId !== null) return;

    const existing = windows.find((window) => window.id === id);

    if (!existing) return;

    const updated = {
      ...existing,
      ...changes,
    };

    setSavingId(id);

    try {
      await db.runAsync(
        `INSERT INTO eating_windows
          (id, label, target_minutes, enabled, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           label = excluded.label,
           target_minutes = excluded.target_minutes,
           enabled = excluded.enabled,
           updated_at = excluded.updated_at`,
        updated.id,
        updated.label,
        updated.targetMinutes,
        updated.enabled ? 1 : 0,
        Date.now(),
      );

      setWindows((current) =>
        current.map((window) => (window.id === id ? updated : window)),
      );
    } catch (error) {
      console.error(error);

      Alert.alert("Couldn't save changes", "Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const changeWindowTime = (id: EatingWindowId, delta: number) => {
    const window = windows.find((item) => item.id === id);

    if (!window) return;

    updateWindow(id, {
      targetMinutes: adjustTime(window.targetMinutes, delta),
    });
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing[5],
          paddingBottom: Math.max(insets.bottom, 12) + 110,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Page title */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>

        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          Make EatSum feel right for you.
        </Text>
      </View>

      {/* Eating windows */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Eating reminders
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                { color: colors.textSecondary },
              ]}
            >
              Choose when you'd like a little nudge.
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: 25 }}
          />
        ) : (
          <View style={styles.windowList}>
            {windows.map((window) => {
              const saving = savingId !== null;
              const disabled = !window.enabled;

              return (
                <View
                  key={window.id}
                  style={[
                    styles.windowCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: disabled ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.windowTop}>
                    <View style={styles.windowIdentity}>
                      <View
                        style={[
                          styles.mealIcon,
                          {
                            backgroundColor: colors.primaryLight,
                          },
                        ]}
                      >
                        <Ionicons
                          name={windowIcons[window.id]}
                          size={20}
                          color={colors.primary}
                        />
                      </View>

                      <View>
                        <Text style={[styles.mealName, { color: colors.text }]}>
                          {window.label}
                        </Text>

                        <Text
                          style={[
                            styles.mealStatus,
                            {
                              color: colors.textSecondary,
                            },
                          ]}
                        >
                          {window.enabled ? "Enabled" : "Turned off"}
                        </Text>
                      </View>
                    </View>

                    <Switch
                      value={window.enabled}
                      disabled={saving}
                      onValueChange={(enabled) =>
                        updateWindow(window.id, {
                          enabled,
                        })
                      }
                      trackColor={{
                        false: colors.border,
                        true: palette.purple[300],
                      }}
                      thumbColor={
                        window.enabled ? palette.purple[600] : colors.surface
                      }
                      ios_backgroundColor={colors.border}
                    />
                  </View>

                  <View
                    style={[
                      styles.timeRow,
                      {
                        borderTopColor: colors.divider,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => changeWindowTime(window.id, -15)}
                      disabled={saving || disabled}
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${window.label} 15 minutes earlier`}
                      style={[
                        styles.timeButton,
                        {
                          backgroundColor: colors.surfaceSecondary,
                        },
                      ]}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={disabled ? colors.textMuted : colors.primary}
                      />
                    </Pressable>

                    <View style={styles.timeDisplay}>
                      <Text style={[styles.timeValue, { color: colors.text }]}>
                        {formatTime(window.targetMinutes)}
                      </Text>

                      <Text
                        style={[
                          styles.timeCaption,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        Preferred time
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => changeWindowTime(window.id, 15)}
                      disabled={saving || disabled}
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${window.label} 15 minutes later`}
                      style={[
                        styles.timeButton,
                        {
                          backgroundColor: colors.surfaceSecondary,
                        },
                      ]}
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={disabled ? colors.textMuted : colors.primary}
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          These times currently guide your companion's expressions. Phone
          notifications are coming later.
        </Text>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Appearance
            </Text>

            <Text
              style={[
                styles.sectionDescription,
                { color: colors.textSecondary },
              ]}
            >
              Choose how EatSum looks on your device.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.appearanceCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {appearanceOptions.map((option) => {
            const selected = preference === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setPreference(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.appearanceOption,
                  {
                    backgroundColor: selected
                      ? colors.primaryLight
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: selected ? "700" : "500",
                  }}
                >
                  {option.label}
                </Text>

                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={21}
                  color={selected ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Developer tools */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Developer tools
          </Text>

          <Pressable
            onPress={() => router.push("/companion-preview")}
            accessibilityRole="button"
            style={[
              styles.previewButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="happy-outline" size={21} color={colors.primary} />

            <Text
              style={{
                flex: 1,
                color: colors.text,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Preview companion moods
            </Text>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing[5],
    gap: spacing[6],
  },

  pageHeader: {
    gap: 5,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
  },

  pageSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },

  section: {
    gap: spacing[4],
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
  },

  windowList: {
    gap: spacing[3],
  },

  windowCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[4],
  },

  windowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  windowIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },

  mealIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  mealName: {
    fontSize: 16,
    fontWeight: "700",
  },

  mealStatus: {
    fontSize: 12,
    marginTop: 3,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: spacing[4],
  },

  timeButton: {
    width: 43,
    height: 43,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  timeDisplay: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },

  timeValue: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },

  timeCaption: {
    fontSize: 11,
  },

  helperText: {
    fontSize: 12,
    lineHeight: 19,
  },

  appearanceCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 7,
    gap: 3,
  },

  appearanceOption: {
    minHeight: 48,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewButton: {
    minHeight: 58,
    paddingHorizontal: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
});
