import { Pressable, StyleSheet, Text, View } from "react-native";

import {
    getDayStatus,
    type DayStatus,
} from "../../features/history/calendar-utils";

import { palette, useTheme } from "../../theme";

type CalendarDayCardProps = {
  date: Date;
  count: number;
  target: number;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  outsideMonth?: boolean;
};

export function CalendarDayCard({
  date,
  count,
  target,
  selected,
  onPress,
  compact = false,
  outsideMonth = false,
}: CalendarDayCardProps) {
  const { colors } = useTheme();

  const status: DayStatus = getDayStatus(count, target);

  const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

  const dateLabel = String(date.getDate());

  const fillColor =
    status === "complete"
      ? palette.purple[600]
      : status === "partial"
        ? colors.primaryLight
        : colors.surface;

  const textColor = status === "complete" ? "#FFFFFF" : colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dayLabel}, ${date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}, ${count} check-ins`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compactCard,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          shadowOpacity: selected ? 0.2 : 0.09,
          elevation: selected ? 5 : 2,
          opacity: outsideMonth ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.innerCard,
          {
            borderRadius: compact ? 10 : 12,
          },
        ]}
      >
        <View
          style={[
            styles.weekdaySection,
            compact && styles.compactWeekday,
            { backgroundColor: colors.surfaceTertiary },
          ]}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.weekdayText, { color: colors.primary }]}
          >
            {dayLabel}
          </Text>
        </View>

        <View
          style={[
            styles.dateSection,
            compact && styles.compactDate,
            { backgroundColor: fillColor },
          ]}
        >
          <Text
            style={[
              styles.dateText,
              compact && styles.compactDateText,
              { color: textColor },
            ]}
          >
            {dateLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 68,
    borderRadius: 12,
    shadowColor: "#06010eff",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,

    // Android
    elevation: 3,
  },

  innerCard: {
    flex: 1,
    overflow: "hidden",
  },

  weekdaySection: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  weekdayText: {
    fontSize: 12,
    fontWeight: "700",
  },

  dateSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  dateText: {
    fontSize: 20,
    fontWeight: "700",
  },

  compactCard: {
    width: "100%",
    height: 66,
    borderRadius: 10,
  },

  compactWeekday: {
    height: 22,
  },

  compactDate: {
    minHeight: 40,
  },

  compactDateText: {
    fontSize: 16,
  },
});
