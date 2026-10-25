import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@react-native-vector-icons/ionicons";
import { EatSumMascot } from "../../components/companion/EatSumMascot";
import { lightColors, palette } from "../../theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Make the mascot wider than the phone so that
  // the purple body extends beyond both edges.
  const mascotWidth = Math.max(width * 1.24, height * 0.52);

  const mascotHeight = mascotWidth * (550 / 780);

  const styles = useMemo(
    () => createStyles(width, height, insets.top, mascotHeight),
    [width, height, insets.top, mascotHeight],
  );

  const handleGetStarted = () => {
    // Temporary destination.
    // Later this will open the next onboarding step.
    router.push("/onboarding/challenges");
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Decorative Floating Shapes in Top Background */}
      <View style={styles.topDecorationContainer} pointerEvents="none">
        <View
          style={[
            styles.shapeCircleLarge,
            { backgroundColor: lightColors.surfaceTertiary },
          ]}
        />
        <View
          style={[
            styles.shapeCircleSmall,
            { backgroundColor: lightColors.primaryPressed },
          ]}
        />
      </View>

      {/* Upper welcome content */}
      <View style={styles.content}>
        <View style={styles.message}>
          <Text style={styles.heading} adjustsFontSizeToFit numberOfLines={3}>
            Eating is better{"\n"}
            together.
          </Text>

          <Text style={styles.description}>
            A little friend to help you take food breaks, get cooking, and make
            eating feel easier.
          </Text>
        </View>

        <Pressable
          onPress={handleGetStarted}
          accessibilityRole="button"
          accessibilityLabel="Get started with EatSum"
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Get started</Text>
          <Ionicons name="arrow-forward" color="#FFFFFF" size={20} />
        </Pressable>
      </View>

      {/* Mascot is deliberately cropped by the screen. */}
      <View
        pointerEvents="none"
        style={[
          styles.mascotContainer,
          {
            width: mascotWidth,
            height: mascotHeight,
            left: (width - mascotWidth) / 2,
          },
        ]}
      >
        <EatSumMascot width={mascotWidth} />
      </View>
    </View>
  );
}

function createStyles(
  width: number,
  height: number,
  topInset: number,
  mascotHeight: number,
) {
  const compact = height < 750;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: lightColors.background,
      overflow: "hidden",
    },

    topDecorationContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      overflow: "hidden",
    },
    shapeCircleLarge: {
      position: "absolute",
      top: -40,
      left: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
    },
    shapeCircleSmall: {
      position: "absolute",
      top: 40,
      right: -30,
      width: 120,
      height: 120,
      borderRadius: 60,
    },

    content: {
      position: "absolute",
      top: topInset + (compact ? 12 : 24),
      left: 24,
      right: 24,
      bottom: mascotHeight * 0.78,
      alignItems: "center",
      justifyContent: "center",
      gap: compact ? 22 : 34,
      zIndex: 2,
    },

    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    brandDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: palette.purple[500],
    },

    brandText: {
      fontSize: 19,
      fontWeight: "800",
      color: palette.purple[700],
      letterSpacing: -0.7,
    },

    message: {
      alignItems: "center",
      gap: compact ? 10 : 16,
      maxWidth: 360,
    },

    heading: {
      fontSize: compact ? 34 : 36,
      fontWeight: "800",
      lineHeight: compact ? 39 : 45,
      letterSpacing: -1.7,
      textAlign: "center",
      color: lightColors.text,
    },

    description: {
      fontSize: 16,
      lineHeight: compact ? 21 : 24,
      textAlign: "center",
      color: lightColors.textSecondary,
      maxWidth: 320,
    },

    button: {
      height: compact ? 52 : 56,
      paddingHorizontal: 32,
      minWidth: Math.min(width - 48, 250),
      backgroundColor: palette.purple[600],
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },

    buttonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },

    buttonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    mascotContainer: {
      position: "absolute",
      bottom: -24,
      zIndex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
    },
  });
}
