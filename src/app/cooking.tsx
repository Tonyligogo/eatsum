import { Ionicons } from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    AppState,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EatingCheckInSheet } from "@/components/eating/EatingCheckInSheet";
import { useCookingAudio } from "@/features/cooking/useCookingAudio";
import { createEatingEvent } from "@/features/eating/record-eating";
import { CheckInWindow } from "@/features/eating/suggest-eating-window";
import { CreateEatingEventInput } from "@/features/eating/types";
import { reconcileEatingNotifications } from "@/features/notifications/reminder-schedule";
import { EatingWindowId } from "@/features/onboarding/eating-windows";
import { useSQLiteContext } from "expo-sqlite";
import { CookingScene } from "../components/cooking/CookingScene";
import { palette, radius, spacing, useTheme } from "../theme";

type SceneSize = {
  width: number;
  height: number;
};

export default function CookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [sceneSize, setSceneSize] = useState<SceneSize>({
    width: 0,
    height: 0,
  });

  const [eatingWindows, setEatingWindows] = useState<CheckInWindow[]>([]);

  const [checkInOpen, setCheckInOpen] = useState(false);

  const [savingCheckIn, setSavingCheckIn] = useState(false);

  const [doneOpen, setDoneOpen] = useState(false);

  const cookingAudio = useCookingAudio();

  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );

  const db = useSQLiteContext();

  const params = useLocalSearchParams<{
    window?: string;
  }>();

  const requestedWindowId: EatingWindowId | null =
    params.window === "breakfast" ||
    params.window === "lunch" ||
    params.window === "dinner"
      ? params.window
      : null;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadEatingWindows() {
      try {
        const rows = await db.getAllAsync<{
          id: EatingWindowId;
          label: string;
          target_minutes: number;
          enabled: number;
        }>(
          `SELECT id, label, target_minutes, enabled
         FROM eating_windows
         ORDER BY target_minutes ASC`,
        );

        if (!active) return;

        setEatingWindows(
          rows.map((row) => ({
            id: row.id,
            label: row.label,
            targetMinutes: row.target_minutes,
            enabled: row.enabled === 1,
          })),
        );
      } catch (error) {
        console.error("Couldn't load eating windows:", error);
      }
    }

    loadEatingWindows();

    return () => {
      active = false;
    };
  }, [db]);

  function handleSceneLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    setSceneSize((current) => {
      if (current.width === width && current.height === height) {
        return current;
      }

      return { width, height };
    });
  }

  function leaveCooking() {
    cookingAudio.pause();
    setDoneOpen(false);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  }

  function handleKeepCooking() {
    setDoneOpen(false);
  }

  function handleEatLater() {
    cookingAudio.pause();
    setDoneOpen(false);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  }

  function handleIHaveEaten() {
    cookingAudio.pause();

    // Close the completion modal first.
    // The existing check-in sheet owns its own modal.
    setDoneOpen(false);
    setCheckInOpen(true);
  }

  async function handleSaveCookingCheckIn(input: CreateEatingEventInput) {
    if (savingCheckIn) return;

    setSavingCheckIn(true);

    try {
      await createEatingEvent(db, {
        ...input,
        source: "COOKING",
      });

      await reconcileEatingNotifications(db);

      setCheckInOpen(false);
      cookingAudio.pause();

      // Home refreshes its data on focus, so it will
      // pick up the newly recorded eating event.
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Couldn't save cooking check-in:", error);
    } finally {
      setSavingCheckIn(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Immersive background */}
      <LinearGradient
        colors={[
          palette.purple[400],
          palette.purple[500],
          palette.purple[600],
          palette.purple[700],
        ]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.safeContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 12) + 12,
          },
        ]}
      >
        {/* Top controls */}
        <View style={styles.header}>
          <Pressable
            onPress={leaveCooking}
            accessibilityRole="button"
            accessibilityLabel="Leave cooking mode"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={23} color="#FFFFFF" />
          </Pressable>

          <View style={styles.modePill}>
            <Ionicons name="restaurant-outline" size={15} color="#FFFFFF" />

            <Text style={styles.modeText}>Cooking mode</Text>
          </View>

          <Pressable
            onPress={() => {
              cookingAudio.pause();
              setDoneOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Finish cooking session"
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.intro}>
          <Text style={styles.heading}>Let's make something tasty!</Text>
        </View>

        {/* Mascot and stove */}
        <View style={styles.sceneContainer} onLayout={handleSceneLayout}>
          {sceneSize.width > 0 && sceneSize.height > 0 && (
            <CookingScene
              width={sceneSize.width}
              height={sceneSize.height}
              active={appActive && !doneOpen && !checkInOpen}
            />
          )}
        </View>

        {/* Small encouragement */}
        <View style={styles.encouragement}>
          <Text style={styles.encouragementText}>
            One little step at a time 💜
          </Text>
        </View>

        {/* Music panel - playback is Phase 4C */}
        <View
          style={[
            styles.musicCard,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View
            style={[
              styles.musicIcon,
              {
                backgroundColor: colors.primaryLight,
              },
            ]}
          >
            <Ionicons
              name="musical-notes-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.musicDetails}>
            <Text style={[styles.musicTitle, { color: colors.text }]}>
              Kitchen calm
            </Text>

            <Text
              style={[styles.musicSubtitle, { color: colors.textSecondary }]}
            >
              {cookingAudio.error
                ? cookingAudio.error
                : cookingAudio.loading
                  ? "Loading music..."
                  : cookingAudio.playing
                    ? "Now playing · Ambient music"
                    : "Ambient music · Tap to play"}
            </Text>
          </View>

          <Pressable
            onPress={cookingAudio.toggle}
            disabled={cookingAudio.loading}
            accessibilityRole="button"
            accessibilityLabel={
              cookingAudio.playing
                ? "Pause background music"
                : "Play background music"
            }
            accessibilityState={{
              disabled: cookingAudio.loading,
            }}
            style={({ pressed }) => [
              styles.playButton,
              {
                backgroundColor: palette.purple[600],
                opacity: cookingAudio.loading || pressed ? 0.55 : 1,
              },
            ]}
          >
            <Ionicons
              name={cookingAudio.playing ? "pause" : "play"}
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>

      {/* Temporary completion sheet.
          We'll integrate eating check-ins in Phase 4D. */}
      <Modal
        visible={doneOpen}
        transparent
        animationType="fade"
        onRequestClose={handleKeepCooking}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={handleKeepCooking}
            accessibilityRole="button"
            accessibilityLabel="Close completion sheet"
          />

          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16) + 18,
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: colors.border }]}
            />

            <View style={styles.completionHeadingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  All done, chef? 💜
                </Text>
              </View>

              <Pressable
                onPress={handleKeepCooking}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={[
                  styles.completionCloseButton,
                  {
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <Text
              style={[styles.modalDescription, { color: colors.textSecondary }]}
            >
              Nice work getting something ready! What would you like to do next?
            </Text>

            <Pressable
              onPress={handleIHaveEaten}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.modalPrimaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.modalPrimaryText}>I've eaten</Text>
            </Pressable>

            <Pressable
              onPress={handleEatLater}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.modalSecondaryButton,
                {
                  backgroundColor: colors.surfaceSecondary,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="time-outline" size={19} color={colors.text} />

              <Text style={[styles.modalSecondaryText, { color: colors.text }]}>
                I'll eat in a bit
              </Text>
            </Pressable>

            <Pressable
              onPress={handleKeepCooking}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.modalTertiaryButton,
                {
                  borderColor: colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.modalSecondaryText, { color: colors.text }]}>
                Keep cooking
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <EatingCheckInSheet
        visible={checkInOpen}
        windows={eatingWindows}
        initialWindowId={
          requestedWindowId &&
          eatingWindows.some(
            (window) => window.id === requestedWindowId && window.enabled,
          )
            ? requestedWindowId
            : null
        }
        saving={savingCheckIn}
        onClose={() => {
          if (!savingCheckIn) {
            setCheckInOpen(false);
          }
        }}
        onSave={handleSaveCookingCheckIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.purple[500],
  },

  safeContent: {
    flex: 1,
    paddingHorizontal: spacing[5],
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  iconButton: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: "rgba(71, 32, 142, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  modePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    gap: 7,
  },

  modeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  doneButton: {
    height: 46,
    minWidth: 66,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  doneText: {
    color: palette.purple[700],
    fontSize: 14,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.8,
  },

  intro: {
    paddingTop: 28,
    alignItems: "center",
    gap: 10,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.9,
    textAlign: "center",
  },

  sceneContainer: {
    flex: 1,
    minHeight: 160,
    marginTop: 4,
    marginHorizontal: -spacing[5],
  },

  encouragement: {
    paddingVertical: 12,
    alignItems: "center",
  },

  encouragementText: {
    color: "#F3E9FF",
    fontSize: 13,
    fontWeight: "600",
  },

  musicCard: {
    minHeight: 80,
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,

    shadowColor: "#32176D",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },

  musicIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  musicDetails: {
    flex: 1,
    gap: 5,
  },

  musicTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  musicSubtitle: {
    fontSize: 12,
  },

  playButton: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledPlayButton: {
    opacity: 0.45,
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(17, 11, 35, 0.55)",
  },

  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 15,
  },

  modalHandle: {
    width: 42,
    height: 5,
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "800",
  },

  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },

  modalPrimaryButton: {
    backgroundColor: palette.purple[600],
    height: 54,
    borderRadius: radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  modalSecondaryButton: {
    height: 52,
    borderRadius: radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  modalPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  modalSecondaryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  completionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  completionCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTertiaryButton: {
    height: 52,
    borderWidth: 1,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});
