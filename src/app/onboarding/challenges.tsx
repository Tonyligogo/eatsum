import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EatSumMascot } from "@/components/companion/EatSumMascot";
import {
    challenges,
    type ChallengeId,
} from "../../features/onboarding/challenges";
import { lightColors, palette, radius, spacing } from "../../theme";

type PreferencesRow = {
  challenges: string;
};

export default function ChallengesScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<ChallengeId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const row = await db.getFirstAsync<PreferencesRow>(
          "SELECT challenges FROM onboarding_preferences WHERE id = 1",
        );

        if (row && active) {
          const parsed: unknown = JSON.parse(row.challenges);

          if (Array.isArray(parsed)) {
            const validIds = challenges.map((item) => item.id);

            setSelected(
              parsed.filter(
                (id): id is ChallengeId =>
                  typeof id === "string" &&
                  validIds.some((validId) => validId === id),
              ),
            );
          }
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [db]);

  function toggleChallenge(id: ChallengeId) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleContinue() {
    if (saving) return;

    setSaving(true);

    try {
      await db.runAsync(
        `INSERT INTO onboarding_preferences
          (id, challenges, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
          challenges = excluded.challenges,
          updated_at = excluded.updated_at`,
        JSON.stringify(selected),
        Date.now(),
      );

      // Temporary destination.
      // This will become the eating-windows screen.
      router.push("/onboarding/eating-times");
    } catch (error) {
      console.error("Failed to save challenges:", error);
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
          { paddingTop: insets.top + spacing[4] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={23} color={lightColors.text} />
          </Pressable>

          <View style={styles.headerMascot}>
            <EatSumMascot width={68} />
          </View>

          <Text style={styles.step}>1 of 2</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
        </View>

        {/* Heading */}
        <View style={styles.intro}>
          <Text style={styles.heading}>What's getting in the way?</Text>

          <Text style={styles.description}>
            Select all that apply. We'll use this to cheer you on in the right
            way!
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {challenges.map((item) => {
            const isSelected = selected.includes(item.id);

            return (
              <Pressable
                key={item.id}
                onPress={() => toggleChallenge(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: isSelected,
                }}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <Text style={styles.optionTitle}>{item.title}</Text>

                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={
                    isSelected ? palette.purple[500] : palette.neutral[400]
                  }
                />
              </Pressable>
            );
          })}
        </View>

        {/* Bottom action */}
        <View style={styles.footer}>
          <Pressable
            disabled={saving}
            onPress={handleContinue}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.continueButton,
              (pressed || saving) && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.continueText}>Continue</Text>

            <Ionicons name="arrow-forward" color="#FFFFFF" size={20} />
          </Pressable>

          <Text style={styles.footerHint}>
            You can always change these later.
          </Text>
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
    justifyContent: "center",
    backgroundColor: lightColors.background,
  },

  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    flexGrow: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },

  headerMascot: {
    width: 64,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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

  progressInactive: {
    flex: 1,
    height: 5,
    backgroundColor: palette.purple[100],
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

  hint: {
    marginTop: spacing[6],
    padding: spacing[4],
    backgroundColor: palette.purple[50],
    borderRadius: radius.lg,
  },

  hintText: {
    color: palette.purple[700],
    fontSize: 14,
    fontWeight: "600",
  },

  options: {
    gap: spacing[3],
    marginTop: spacing[5],
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minHeight: 66,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: lightColors.border,
    backgroundColor: lightColors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  optionSelected: {
    borderColor: palette.purple[500],
    backgroundColor: palette.purple[50],
  },

  optionPressed: {
    opacity: 0.8,
  },

  optionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: lightColors.text,
  },

  footer: {
    marginTop: "auto",
    paddingTop: spacing[8],
    alignItems: "center",
    gap: spacing[4],
  },

  continueButton: {
    width: "100%",
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

  footerHint: {
    fontSize: 13,
    color: lightColors.textSecondary,
  },
});
