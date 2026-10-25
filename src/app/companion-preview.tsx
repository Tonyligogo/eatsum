import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EatSumMascot2 } from "../components/companion/EatSumMascot2";

import {
    COMPANION_MOODS,
    companionMoodLabels,
    type CompanionMood,
} from "../features/companion/moods";

import { palette, radius, spacing, useTheme } from "../theme";

export default function CompanionPreviewScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [mood, setMood] = useState<CompanionMood>("relaxed");

  const mascotWidth = Math.min(width - 64, 340);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing[6],
        paddingTop: spacing[6],
        paddingBottom: insets.bottom + 40,
        gap: spacing[6],
      }}
    >
      <View style={{ gap: 6 }}>
        <Text style={[styles.heading, { color: colors.text }]}>
          Meet your moods 💜
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 15,
            lineHeight: 23,
          }}
        >
          Try each expression before we connect it to your eating routine.
        </Text>
      </View>

      <View
        style={[styles.preview, { backgroundColor: colors.surfaceSecondary }]}
      >
        <View style={{ height: 270, justifyContent: "flex-end" }}>
          <EatSumMascot2 width={mascotWidth} mood={mood} />
        </View>
      </View>

      <Text style={[styles.moodTitle, { color: colors.text }]}>
        {companionMoodLabels[mood]}
      </Text>

      <View style={styles.moodGrid}>
        {COMPANION_MOODS.map((item) => {
          const selected = mood === item;

          return (
            <Pressable
              key={item}
              onPress={() => setMood(item)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.moodButton,
                {
                  backgroundColor: selected
                    ? palette.purple[600]
                    : colors.surface,

                  borderColor: selected ? palette.purple[600] : colors.border,

                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? "#FFFFFF" : colors.text,
                  fontSize: 14,
                  fontWeight: selected ? "700" : "500",
                }}
              >
                {companionMoodLabels[item]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
  },

  preview: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
    height: 285,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  moodTitle: {
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
  },

  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },

  moodButton: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
