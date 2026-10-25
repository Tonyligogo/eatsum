import { StyleSheet, Text, View } from "react-native";

import Svg, { Line } from "react-native-svg";

import { Ionicons } from "@react-native-vector-icons/ionicons";

import { EatSumMascot } from "../companion/EatSumMascot";

import {
    getCheckInContent,
    type HistoryCheckIn,
    type HistoryEatingWindow,
} from "../../features/history/check-in-content";

import { palette, radius, useTheme } from "../../theme";

type Props = {
  events: HistoryCheckIn[];
  windows: HistoryEatingWindow[];
};

export function CheckInTimeline({ events, windows }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.timeline}>
      {events.map((event, index) => {
        const date = new Date(event.occurred_at);

        const content = getCheckInContent(event, windows);

        const isLast = index === events.length - 1;

        const time = date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        });

        return (
          <View key={event.id} style={styles.timelineRow}>
            {/* LEFT: TIME + CHECKMARK + DOTS */}
            <View style={styles.timeColumn}>
              <Text style={[styles.time, { color: colors.text }]}>{time}</Text>

              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              </View>

              {!isLast && (
                <View style={styles.lineContainer}>
                  <Svg width={3} height="100%" style={styles.dottedLine}>
                    <Line
                      x1="1.5"
                      y1="0"
                      x2="1.5"
                      y2="100%"
                      stroke={palette.purple[400]}
                      strokeWidth={2}
                      strokeDasharray="3 6"
                    />
                  </Svg>
                </View>
              )}
            </View>

            {/* RIGHT: CONTEXTUAL ENTRY CARD */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  shadowColor: colors.shadow,
                  shadowOpacity: isDark ? 0.2 : 0.08,
                },
              ]}
            >
              <View style={styles.textContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {content.title}
                </Text>

                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {content.description}
                </Text>
              </View>

              {/* Proud mascot directly on the card */}
              <View pointerEvents="none" style={styles.mascotPosition}>
                <EatSumMascot mood="proud" width={112} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    paddingTop: 8,
    paddingHorizontal: 3,
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    minHeight: 156,
  },

  // Left timeline column
  timeColumn: {
    width: 48,
    alignItems: "center",
    paddingTop: 12,
  },

  time: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },

  checkmark: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: palette.purple[500],

    alignItems: "center",
    justifyContent: "center",

    marginTop: 12,
    zIndex: 1,
  },

  lineContainer: {
    flex: 1,
    width: 3,
    minHeight: 35,
    marginTop: 7,
    marginBottom: 0,
    alignItems: "center",
  },

  dottedLine: {
    width: 3,
  },

  // Right-hand entry card
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 132,
    marginBottom: 18,

    borderRadius: radius.xl,
    padding: 15,

    position: "relative",

    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 9,

    elevation: 3,
  },

  textContent: {
    paddingRight: 70,
    gap: 8,
    zIndex: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 19,
  },

  // No colored wrapper; mascot peeks
  // directly from the lower-right edge.
  mascotPosition: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 112,
    height: 80,

    alignItems: "center",
    justifyContent: "flex-end",
  },
});
