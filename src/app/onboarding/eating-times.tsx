import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
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

import { lightColors, palette, radius, spacing } from "../../theme";

import { EatSumMascot } from "@/components/companion/EatSumMascot";
import {
  adjustTime,
  defaultEatingWindows,
  formatTime,
  type EatingWindow,
  type EatingWindowId,
} from "../../features/onboarding/eating-windows";

type WindowRow = {
  id: EatingWindowId;
  label: string;
  target_minutes: number;
  enabled: number;
};

export default function EatingTimesScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [windows, setWindows] = useState<EatingWindow[]>(defaultEatingWindows);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWindows() {
      try {
        const rows = await db.getAllAsync<WindowRow>(
          `SELECT id, label, target_minutes, enabled
           FROM eating_windows`,
        );

        if (!active) return;

        if (rows.length > 0) {
          setWindows(
            defaultEatingWindows.map((item) => {
              const saved = rows.find((row) => row.id === item.id);

              if (!saved) return item;

              return {
                id: item.id,
                label: saved.label,
                targetMinutes: saved.target_minutes,
                enabled: saved.enabled === 1,
              };
            }),
          );
        }
      } catch (error) {
        console.error("Failed to load eating windows:", error);
        Alert.alert(
          "Something went wrong",
          "We couldn't load your saved eating times.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWindows();

    return () => {
      active = false;
    };
  }, [db]);

  function toggleWindow(id: EatingWindowId) {
    setWindows((current) =>
      current.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  }

  function changeTime(id: EatingWindowId, adjustment: number) {
    setWindows((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              targetMinutes: adjustTime(item.targetMinutes, adjustment),
            }
          : item,
      ),
    );
  }

  async function handleFinish() {
    if (saving) return;

    setSaving(true);

    try {
      // An exclusive transaction keeps saving the
      // routine and completing onboarding atomic.
      await db.withExclusiveTransactionAsync(async (tx) => {
        const now = Date.now();

        for (const item of windows) {
          await tx.runAsync(
            `INSERT INTO eating_windows
              (id, label, target_minutes, enabled, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
              label = excluded.label,
              target_minutes = excluded.target_minutes,
              enabled = excluded.enabled,
              updated_at = excluded.updated_at`,
            item.id,
            item.label,
            item.targetMinutes,
            item.enabled ? 1 : 0,
            now,
          );
        }

        await tx.runAsync(
          `INSERT INTO onboarding_preferences
            (id, challenges, updated_at, onboarding_completed)
           VALUES (1, '[]', ?, 1)
           ON CONFLICT(id) DO UPDATE SET
             onboarding_completed = 1,
             updated_at = excluded.updated_at`,
          now,
        );
      });

      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Failed to finish onboarding:", error);

      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.purple[500]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing[4],
            paddingBottom: insets.bottom + spacing[6],
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/onboarding/challenges");
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={23} color={lightColors.text} />
          </Pressable>

          <View style={styles.headerMascot}>
            <EatSumMascot width={68} />
          </View>
          <Text style={styles.step}>2 of 2</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.heading}>When should I check on you?</Text>

          <Text style={styles.description}>
            Pick a few times that work for you. I'll give you a little nudge
            when it's time to think about food.
          </Text>
        </View>

        <View style={styles.options}>
          {windows.map((item) => (
            <View
              key={item.id}
              style={[styles.card, !item.enabled && styles.cardDisabled]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleArea}>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  <Text style={styles.cardSubtitle}>
                    {item.enabled ? "Reminder enabled" : "Reminder off"}
                  </Text>
                </View>

                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleWindow(item.id)}
                  trackColor={{
                    false: palette.neutral[200],
                    true: palette.purple[300],
                  }}
                  thumbColor={
                    item.enabled ? palette.purple[600] : palette.neutral.white
                  }
                  accessibilityLabel={`${item.label} reminder`}
                />
              </View>

              {item.enabled && (
                <View style={styles.timeRow}>
                  <Pressable
                    onPress={() => changeTime(item.id, -30)}
                    style={styles.timeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Earlier ${item.label} reminder`}
                  >
                    <Ionicons
                      name="remove"
                      size={22}
                      color={palette.purple[700]}
                    />
                  </Pressable>

                  <Text style={styles.timeText}>
                    {formatTime(item.targetMinutes)}
                  </Text>

                  <Pressable
                    onPress={() => changeTime(item.id, 30)}
                    style={styles.timeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Later ${item.label} reminder`}
                  >
                    <Ionicons
                      name="add"
                      size={22}
                      color={palette.purple[700]}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            These are just reminders, not strict meal times. You can change them
            later.
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            disabled={saving}
            onPress={handleFinish}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.continueButton,
              (pressed || saving) && { opacity: 0.8 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueText}>Let's get eating!</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: lightColors.background,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing[6],
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerMascot: {
    width: 64,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },
  step: {
    fontSize: 13,
    color: lightColors.textSecondary,
  },
  progressTrack: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[5],
  },
  progressActive: {
    flex: 1,
    height: 5,
    backgroundColor: palette.purple[500],
    borderRadius: radius.full,
  },
  intro: {
    marginTop: spacing[10],
    gap: spacing[3],
  },
  heading: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "800",
    letterSpacing: -1,
    color: lightColors.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: lightColors.textSecondary,
  },
  options: {
    gap: spacing[3],
    marginTop: spacing[8],
  },
  card: {
    backgroundColor: lightColors.surface,
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[4],
  },
  cardDisabled: {
    backgroundColor: palette.neutral[100],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  cardTitleArea: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: lightColors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: lightColors.textSecondary,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.purple[50],
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.purple[700],
    fontVariant: ["tabular-nums"],
  },
  hint: {
    marginTop: spacing[6],
    padding: spacing[4],
    backgroundColor: palette.purple[50],
    borderRadius: radius.lg,
  },
  hintText: {
    color: palette.purple[700],
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    marginTop: "auto",
    paddingTop: spacing[8],
  },
  continueButton: {
    minHeight: 56,
    backgroundColor: palette.purple[600],
    borderRadius: radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  continueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
