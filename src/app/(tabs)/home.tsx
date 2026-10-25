import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ThemeColors } from "../../theme";
import { palette, radius, spacing, useTheme } from "../../theme";

import { StatusBar } from "expo-status-bar";
import { getGreeting } from "../../features/companion/get-home-message";

import {
  getCompanionState,
  type CompanionWindow,
} from "../../features/companion/get-companion-state";

import { EatSumMascot2 } from "@/components/companion/EatSumMascot2";
import { EatingCheckInSheet } from "@/components/eating/EatingCheckInSheet";
import { EatingFollowUpCard } from "@/components/eating/EatingFollowupCard";
import {
  findDueFollowUp,
  FollowUpAction,
  saveFollowUpResponse,
} from "@/features/eating/followup-repository";
import { DueFollowUp } from "@/features/eating/get-due-followup";
import { createEatingEvent } from "@/features/eating/record-eating";
import { CreateEatingEventInput } from "@/features/eating/types";
import type { EatingWindowId } from "../../features/onboarding/eating-windows";

type EatingSummary = {
  count: number;
  last_meal: number | null;
};
type EatingEventRow = {
  occurred_at: number;
};

type EatingWindowRow = {
  id: string;
  label: string;
  target_minutes: number;
  enabled: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const { colors } = useTheme();

  const [todayCount, setTodayCount] = useState(0);
  const [eatingTimes, setEatingTimes] = useState<number[]>([]);
  const [eatingWindows, setEatingWindows] = useState<CompanionWindow[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [checkInOpen, setCheckInOpen] = useState(false);

  const [celebrating, setCelebrating] = useState(false);

  const [pendingUndo, setPendingUndo] = useState<{
    eventId: number;
  } | null>(null);

  const [dueFollowUp, setDueFollowUp] = useState<DueFollowUp | null>(null);

  const [followUpBusy, setFollowUpBusy] = useState(false);

  const [checkInInitialWindowId, setCheckInInitialWindowId] =
    useState<EatingWindowId | null>(null);

  const [undoing, setUndoing] = useState(false);

  const celebrationScale = useRef(new Animated.Value(1)).current;

  const celebrationLift = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const refreshFollowUp = useCallback(async () => {
    const due = await findDueFollowUp(db);
    setDueFollowUp(due);
  }, [db]);

  const refresh = useCallback(async () => {
    const now = new Date();

    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    ).getTime();

    const [events, windows] = await Promise.all([
      db.getAllAsync<EatingEventRow>(
        `SELECT occurred_at
       FROM eating_events
       WHERE occurred_at >= ?
         AND occurred_at < ?
       ORDER BY occurred_at DESC`,
        start,
        end,
      ),

      db.getAllAsync<EatingWindowRow>(
        `SELECT id, label, target_minutes, enabled
       FROM eating_windows`,
      ),
    ]);

    await refreshFollowUp();

    const times = events.map((event) => event.occurred_at);

    const validIds: EatingWindowId[] = ["breakfast", "lunch", "dinner"];

    setTodayCount(times.length);
    setEatingTimes(times);

    setEatingWindows(
      windows
        .filter((window) => validIds.includes(window.id as EatingWindowId))
        .map((window) => ({
          id: window.id as EatingWindowId,
          label: window.label,
          targetMinutes: window.target_minutes,
          enabled: window.enabled === 1,
        })),
    );

    setCurrentTime(Date.now());
  }, [db, refreshFollowUp]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const update = () => {
        if (active) {
          refresh().catch(console.error);
        }
      };

      update();

      // Check once a minute while Home is focused.
      const interval = setInterval(update, 60_000);

      // Refresh when returning from another app.
      const subscription = AppState.addEventListener("change", (status) => {
        if (status === "active") {
          update();
        }
      });

      return () => {
        active = false;
        clearInterval(interval);
        subscription.remove();
      };
    }, [refresh]),
  );

  useEffect(() => {
    if (!celebrating) return;

    celebrationScale.setValue(1);
    celebrationLift.setValue(0);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(celebrationScale, {
          toValue: 1.08,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationLift, {
          toValue: -14,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(celebrationLift, {
          toValue: 0,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    const timeout = setTimeout(() => {
      setCelebrating(false);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      animation.stop();

      celebrationScale.setValue(1);
      celebrationLift.setValue(0);
    };
  }, [celebrating, celebrationScale, celebrationLift]);

  useEffect(() => {
    if (!pendingUndo) return;

    const timeout = setTimeout(() => {
      setPendingUndo(null);
    }, 6000);

    return () => clearTimeout(timeout);
  }, [pendingUndo]);

  const now = useMemo(() => new Date(currentTime), [currentTime]);

  const greeting = getGreeting(now.getHours());

  const companion = useMemo(
    () =>
      getCompanionState({
        now,
        windows: eatingWindows,
        eatingTimes,
      }),
    [now, eatingWindows, eatingTimes],
  );

  async function saveEatingCheckIn(
    input: CreateEatingEventInput,
  ): Promise<void> {
    if (saving || undoing) return;

    setSaving(true);

    try {
      const eventId = await createEatingEvent(db, input);

      // Save the precise record ID for Undo.
      setPendingUndo({ eventId });

      // Close the sheet after a successful save.
      setCheckInOpen(false);

      // Trigger the Proud expression and bounce.
      setCelebrating(true);

      // Reload SQLite records and update Home.
      await refresh();
    } catch (error) {
      console.error("Failed to save eating check-in:", error);

      Alert.alert(
        "Couldn't save check-in",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function undoEating() {
    if (!pendingUndo || undoing || saving) return;

    const eventId = pendingUndo.eventId;

    setUndoing(true);

    // Hide the confirmation immediately.
    setPendingUndo(null);
    setCelebrating(false);

    try {
      await db.runAsync(`DELETE FROM eating_events WHERE id = ?`, eventId);

      // Recalculate the count and companion state
      // using the records still in SQLite.
      await refresh();
    } catch (error) {
      console.error("Failed to undo eating check-in:", error);

      Alert.alert(
        "Couldn't undo",
        "Your check-in may still be saved. Please check your history.",
      );
    } finally {
      setUndoing(false);
    }
  }

  async function respondToFollowUp(action: FollowUpAction) {
    if (!dueFollowUp || followUpBusy) return;

    setFollowUpBusy(true);

    try {
      await saveFollowUpResponse(db, dueFollowUp.windowId, action);

      await refreshFollowUp();
    } catch (error) {
      console.error("Failed to save follow-up response:", error);

      Alert.alert("Couldn't save your response", "Please try again.");
    } finally {
      setFollowUpBusy(false);
    }
  }

  function openFollowUpCheckIn() {
    if (!dueFollowUp) return;

    setCheckInInitialWindowId(dueFollowUp.windowId);
    setCheckInOpen(true);
  }

  function openRegularCheckIn() {
    setCheckInInitialWindowId(null);
    setCheckInOpen(true);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="auto" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing[4],
            paddingBottom: Math.max(insets.bottom, 12) + 110,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>

            <Text style={styles.title}>Hey, chef!</Text>
          </View>

          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={styles.settingsButton}
          >
            <Ionicons
              name="settings-outline"
              size={23}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {/* Companion */}
        <View style={styles.companionCard}>
          <View style={styles.speechBubble}>
            <Text style={styles.companionMessage}>
              {celebrating
                ? "Look at you taking care of yourself! 💜"
                : companion.message}
            </Text>
          </View>

          <View style={styles.mascotArea}>
            {/* <EatSumMascot2 width={340} mood={companion.mood} /> */}

            <Animated.View
              style={{
                transform: [
                  { scale: celebrationScale },
                  { translateY: celebrationLift },
                ],
              }}
            >
              <EatSumMascot2
                width={340}
                mood={celebrating ? "proud" : companion.mood}
              />
            </Animated.View>
          </View>
        </View>

        {dueFollowUp && (
          <EatingFollowUpCard
            followUp={dueFollowUp}
            busy={followUpBusy}
            onAte={openFollowUpCheckIn}
            onNotYet={() => respondToFollowUp("NOT_YET")}
            onSnooze={() => respondToFollowUp("SNOOZED")}
            onDismiss={() => respondToFollowUp("DISMISSED")}
          />
        )}

        {/* Daily progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIcon}>
              <Ionicons
                name="restaurant-outline"
                size={21}
                color={palette.purple[700]}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>Today's little wins</Text>

              <Text style={styles.progressDescription}>
                Every check-in counts.
              </Text>
            </View>

            <Text style={styles.progressCount}>{todayCount}</Text>
          </View>

          <Pressable
            onPress={() => router.push("/history")}
            accessibilityRole="button"
            style={styles.historyLink}
          >
            <Text style={styles.historyText}>View history</Text>

            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/cooking",
                params: { window: "dinner" },
              })
            }
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="restaurant" size={21} color="#FFFFFF" />

            <Text style={styles.primaryButtonText}>Let's make something</Text>
          </Pressable>

          <Pressable
            onPress={openRegularCheckIn}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
              saving && { opacity: 0.5 },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={colors.primary}
            />

            <Text style={styles.secondaryButtonText}>I've eaten</Text>
          </Pressable>
        </View>
      </ScrollView>
      {pendingUndo && (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.checkInToast,
            {
              bottom: Math.max(insets.bottom, 12) + 100,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.toastIcon}>
            <Ionicons name="checkmark" size={21} color="#FFFFFF" />
          </View>

          <View style={styles.toastContent}>
            <Text style={[styles.toastTitle, { color: colors.text }]}>
              Check-in saved!
            </Text>

            <Text
              style={[styles.toastDescription, { color: colors.textSecondary }]}
            >
              Another little win 💜
            </Text>
          </View>

          <Pressable
            onPress={undoEating}
            disabled={undoing}
            accessibilityRole="button"
            accessibilityLabel="Undo the last eating check-in"
            style={styles.undoButton}
          >
            <Text style={[styles.undoText, { color: colors.primary }]}>
              Undo
            </Text>
          </Pressable>
        </View>
      )}
      <EatingCheckInSheet
        visible={checkInOpen}
        windows={eatingWindows}
        saving={saving}
        onClose={() => {
          if (!saving) setCheckInOpen(false);
        }}
        onSave={saveEatingCheckIn}
        initialWindowId={checkInInitialWindowId}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      flexGrow: 1,
      paddingHorizontal: spacing[6],
      gap: spacing[5],
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    greeting: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 4,
    },

    title: {
      color: colors.text,
      fontSize: 29,
      fontWeight: "800",
      letterSpacing: -1,
    },

    settingsButton: {
      width: 46,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
    },

    companionCard: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius["2xl"],
      paddingTop: spacing[6],
      overflow: "hidden",
      alignItems: "center",
      minHeight: 310,
    },

    speechBubble: {
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[3],
      maxWidth: 310,
    },

    companionMessage: {
      fontSize: 17,
      fontWeight: "600",
      lineHeight: 25,
      textAlign: "center",
      color: colors.text,
    },

    mascotArea: {
      alignItems: "center",
      justifyContent: "flex-end",
      height: 220,
      overflow: "hidden",
    },

    progressCard: {
      padding: spacing[4],
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      gap: spacing[4],
    },

    progressHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },

    progressIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: palette.purple[50],
      alignItems: "center",
      justifyContent: "center",
    },

    progressTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },

    progressDescription: {
      fontSize: 12,
      marginTop: 3,
      color: colors.textSecondary,
    },

    progressCount: {
      fontSize: 27,
      fontWeight: "800",
      color: colors.primary,
    },

    historyLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      paddingTop: spacing[2],
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },

    historyText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },

    actions: {
      gap: spacing[3],
      marginTop: "auto",
    },

    primaryButton: {
      minHeight: 58,
      borderRadius: radius.xl,
      backgroundColor: palette.purple[600],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[3],
      paddingHorizontal: spacing[4],
    },

    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },

    secondaryButton: {
      minHeight: 56,
      borderRadius: radius.xl,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[3],
    },

    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },

    checkInToast: {
      position: "absolute",
      left: spacing[5],
      right: spacing[5],

      minHeight: 72,
      borderRadius: radius.xl,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],

      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],

      borderWidth: 1,

      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },

    toastIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.full,

      backgroundColor: palette.purple[600],

      alignItems: "center",
      justifyContent: "center",
    },

    toastContent: {
      flex: 1,
      gap: 3,
    },

    toastTitle: {
      fontSize: 14,
      fontWeight: "700",
    },

    toastDescription: {
      fontSize: 12,
    },

    undoButton: {
      minHeight: 44,
      minWidth: 48,
      alignItems: "center",
      justifyContent: "center",
    },

    undoText: {
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
