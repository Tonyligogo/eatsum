import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette, radius, spacing, useTheme } from "../../theme";

import type {
  CreateEatingEventInput,
  EatingCategory,
} from "../../features/eating/types";

import {
  suggestEatingWindow,
  type CheckInWindow,
} from "../../features/eating/suggest-eating-window";

import type { EatingWindowId } from "../../features/onboarding/eating-windows";

type Props = {
  visible: boolean;
  windows: CheckInWindow[];
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreateEatingEventInput) => Promise<void>;
  initialWindowId?: EatingWindowId | null;
};

const MAX_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const STEP_MS = 15 * 60 * 1000;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatDay(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();

  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (sameDay) return "Today";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EatingCheckInSheet({
  visible,
  windows,
  saving,
  onClose,
  onSave,
  initialWindowId = null,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<EatingCategory>("MEAL");

  const [windowId, setWindowId] = useState<EatingWindowId | null>(null);

  const [occurredAt, setOccurredAt] = useState(() => Date.now());

  // Reset the form every time the sheet opens.
  useEffect(() => {
    if (!visible) return;

    const now = Date.now();

    setOccurredAt(now);
    setCategory("MEAL");

    const explicitlySelectedWindow = windows.find(
      (window) => window.id === initialWindowId && window.enabled,
    );

    setWindowId(
      explicitlySelectedWindow
        ? explicitlySelectedWindow.id
        : suggestEatingWindow(new Date(now), windows),
    );
  }, [visible, initialWindowId, windows]);

  function changeCategory(next: EatingCategory) {
    setCategory(next);

    if (next === "SNACK") {
      setWindowId(null);
    } else {
      setWindowId(suggestEatingWindow(new Date(occurredAt), windows));
    }
  }

  function changeTime(delta: number) {
    const now = Date.now();

    const earliest = now - MAX_LOOKBACK_MS;

    const next = Math.max(earliest, Math.min(now, occurredAt + delta));

    setOccurredAt(next);

    // Re-suggest only if the current selection is empty.
    // An explicitly selected window is not overwritten.
    if (category === "MEAL" && windowId === null) {
      setWindowId(suggestEatingWindow(new Date(next), windows));
    }
  }

  async function handleSave() {
    if (saving) return;

    await onSave({
      category,
      eatingWindowId: windowId,
      occurredAt,
      source: "HOME",
    });
  }

  const enabledWindows = windows.filter((window) => window.enabled);

  const canGoBack = occurredAt - STEP_MS >= Date.now() - MAX_LOOKBACK_MS;

  const canGoForward = occurredAt + STEP_MS <= Date.now();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {
        if (!saving) onClose();
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          disabled={saving}
          onPress={onClose}
          accessibilityLabel="Close check-in"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardContainer}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16) + 16,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.header}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={[styles.title, { color: colors.text }]}>
                  What did you have? 💜
                </Text>

                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Just a little check-in.
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.closeButton}
              >
                <Ionicons name="close" size={23} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.form}
            >
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                What was it?
              </Text>

              <View style={styles.categoryRow}>
                {(
                  [
                    {
                      id: "MEAL",
                      label: "Meal",
                      icon: "restaurant-outline",
                    },
                    {
                      id: "SNACK",
                      label: "Snack",
                      icon: "cafe-outline",
                    },
                  ] as const
                ).map((item) => {
                  const selected = category === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      disabled={saving}
                      onPress={() => changeCategory(item.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor: selected
                            ? colors.primaryLight
                            : colors.surfaceSecondary,

                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={23}
                        color={colors.primary}
                      />

                      <Text
                        style={[styles.categoryText, { color: colors.text }]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.fieldHeading}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Which eating window?
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                  }}
                >
                  Optional
                </Text>
              </View>

              <View style={styles.windowGrid}>
                {[
                  ...enabledWindows.map((window) => ({
                    id: window.id as EatingWindowId | null,
                    label: window.label,
                  })),
                  {
                    id: null,
                    label: "None",
                  },
                ].map((window) => {
                  const selected = windowId === window.id;

                  return (
                    <Pressable
                      key={window.id ?? "none"}
                      disabled={saving}
                      onPress={() => setWindowId(window.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[
                        styles.windowOption,
                        {
                          backgroundColor: selected
                            ? palette.purple[600]
                            : colors.surfaceSecondary,
                          borderColor: selected
                            ? palette.purple[600]
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: selected ? "#FFFFFF" : colors.text,
                          fontWeight: "600",
                          fontSize: 13,
                        }}
                      >
                        {window.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  lineHeight: 18,
                }}
              >
                Only a window you select will count toward that eating time.
                Snacks default to None.
              </Text>

              <View style={styles.timeSection}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    When did you eat?
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {formatDay(occurredAt)}
                  </Text>
                </View>

                <View style={styles.timeControls}>
                  <Pressable
                    onPress={() => changeTime(-STEP_MS)}
                    disabled={saving || !canGoBack}
                    style={[
                      styles.timeButton,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        opacity: canGoBack ? 1 : 0.4,
                      },
                    ]}
                  >
                    <Ionicons name="remove" size={20} color={colors.primary} />
                  </Pressable>

                  <Text style={[styles.timeText, { color: colors.text }]}>
                    {formatTime(occurredAt)}
                  </Text>

                  <Pressable
                    onPress={() => changeTime(STEP_MS)}
                    disabled={saving || !canGoForward}
                    style={[
                      styles.timeButton,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        opacity: canGoForward ? 1 : 0.4,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: palette.purple[600],
                  opacity: saving || pressed ? 0.75 : 1,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>Save check-in</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 16, 33, 0.48)",
  },

  keyboardContainer: {
    justifyContent: "flex-end",
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing[5],
    paddingTop: 12,
    maxHeight: "92%",
    gap: spacing[4],
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
  },

  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  form: {
    gap: spacing[3],
    paddingVertical: 4,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  categoryRow: {
    flexDirection: "row",
    gap: spacing[3],
  },

  categoryOption: {
    flex: 1,
    minHeight: 82,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  categoryText: {
    fontSize: 14,
    fontWeight: "700",
  },

  fieldHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },

  windowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },

  windowOption: {
    width: "48%",
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  timeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },

  timeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  timeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  timeText: {
    fontSize: 17,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    minWidth: 49,
    textAlign: "center",
  },

  saveButton: {
    minHeight: 56,
    borderRadius: radius.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
