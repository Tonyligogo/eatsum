import { Ionicons } from "@react-native-vector-icons/ionicons";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { palette, radius, spacing, useTheme } from "../../theme";

import type { DueFollowUp } from "../../features/eating/get-due-followup";

type Props = {
  followUp: DueFollowUp;
  busy: boolean;
  onAte: () => void;
  onNotYet: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
};

export function EatingFollowUpCard({
  followUp,
  busy,
  onAte,
  onNotYet,
  onSnooze,
  onDismiss,
}: Props) {
  const { colors } = useTheme();

  const meal = followUp.label.toLowerCase();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <Ionicons name="heart-outline" color={colors.primary} size={23} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            How did {meal} go? 💜
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            No {meal} recorded yet. Did you get a chance to eat?
          </Text>
        </View>
      </View>

      {busy ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ paddingVertical: 12 }}
        />
      ) : (
        <View style={styles.actions}>
          <FollowUpButton
            label="I ate"
            primary
            onPress={onAte}
            disabled={busy}
          />

          <FollowUpButton label="Not yet" onPress={onNotYet} disabled={busy} />

          {!followUp.snoozedBefore && (
            <FollowUpButton
              label="Remind me later"
              onPress={onSnooze}
              disabled={busy}
            />
          )}

          <FollowUpButton label="Dismiss" onPress={onDismiss} disabled={busy} />
        </View>
      )}
    </View>
  );
}

function FollowUpButton({
  label,
  primary = false,
  disabled,
  onPress,
}: {
  label: string;
  primary?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: primary
            ? palette.purple[600]
            : colors.surfaceSecondary,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.actionText,
          {
            color: primary ? "#FFFFFF" : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[4],
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  textContainer: {
    flex: 1,
    gap: 5,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },

  actionButton: {
    width: "48%",
    minHeight: 45,
    paddingHorizontal: 7,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
