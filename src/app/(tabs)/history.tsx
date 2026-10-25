import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarDayCard } from "../../components/history/CalendarDayCard";

import {
  addDays,
  dateKey,
  formatWeekRange,
  getMonthDays,
  getWeekDays,
  startOfDay,
  startOfWeek,
} from "../../features/history/calendar-utils";

import { CheckInTimeline } from "@/components/history/CheckInTimeline";
import {
  HistoryCheckIn,
  HistoryEatingWindow,
} from "@/features/history/check-in-content";
import { palette, radius, spacing, useTheme } from "../../theme";

type EatingRow = HistoryCheckIn;

export default function HistoryScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date()),
  );

  const [visibleWeek, setVisibleWeek] = useState(() => startOfWeek(new Date()));

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [events, setEvents] = useState<EatingRow[]>([]);
  const [target, setTarget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eatingWindows, setEatingWindows] = useState<HistoryEatingWindow[]>([]);

  const weekDays = useMemo(() => getWeekDays(visibleWeek), [visibleWeek]);

  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);

  // Covers the currently displayed week and month.
  const queryRange = useMemo(() => {
    const monthStart = startOfWeek(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1),
    );

    const weekEnd = addDays(visibleWeek, 7);

    const monthEnd = addDays(monthDays[monthDays.length - 1], 1);

    return {
      start: Math.min(visibleWeek.getTime(), monthStart.getTime()),
      end: Math.max(weekEnd.getTime(), monthEnd.getTime()),
    };
  }, [visibleWeek, visibleMonth, monthDays]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHistory() {
        setLoading(true);

        try {
          const [savedEvents, savedWindows] = await Promise.all([
            db.getAllAsync<EatingRow>(
              `SELECT
       id,
       occurred_at,
       category,
       source,
       eating_window_id
     FROM eating_events
     WHERE occurred_at >= ?
       AND occurred_at < ?
     ORDER BY occurred_at DESC`,
              queryRange.start,
              queryRange.end,
            ),

            db.getAllAsync<HistoryEatingWindow>(
              `SELECT
       id,
       label,
       target_minutes,
       enabled
     FROM eating_windows`,
            ),
          ]);

          if (!active) return;

          setEvents(savedEvents);
          setEatingWindows(savedWindows);
          setTarget(
            savedWindows.filter((window) => window.enabled === 1).length,
          );

          if (!active) return;

          setEvents(savedEvents);
          setEatingWindows(savedWindows);
          setTarget(
            savedWindows.filter((window) => window.enabled === 1).length,
          );
        } catch (error) {
          console.error("Failed to load eating history:", error);
        } finally {
          if (active) setLoading(false);
        }
      }

      loadHistory();

      return () => {
        active = false;
      };
    }, [db, queryRange.start, queryRange.end]),
  );

  // Group eating records by local calendar date.

  const counts = useMemo(() => {
    // Only enabled windows can contribute to coverage.
    const enabledWindowIds = new Set(
      eatingWindows
        .filter((window) => window.enabled === 1)
        .map((window) => window.id),
    );

    // Each day holds a set of distinct covered windows.
    const coverageByDay: Record<string, Set<string>> = {};

    for (const event of events) {
      const windowId = event.eating_window_id;

      // Unassigned eating records don't cover a window.
      if (windowId === null || !enabledWindowIds.has(windowId)) {
        continue;
      }

      const key = dateKey(new Date(event.occurred_at));

      if (!coverageByDay[key]) {
        coverageByDay[key] = new Set<string>();
      }

      coverageByDay[key].add(windowId);
    }

    const result: Record<string, number> = {};

    for (const [key, coveredWindows] of Object.entries(coverageByDay)) {
      result[key] = coveredWindows.size;
    }

    return result;
  }, [events, eatingWindows]);

  const selectedKey = dateKey(selectedDate);

  const selectedEvents = useMemo(
    () =>
      events.filter(
        (event) => dateKey(new Date(event.occurred_at)) === selectedKey,
      ),
    [events, selectedKey],
  );

  function selectDay(date: Date) {
    const day = startOfDay(date);

    setSelectedDate(day);
    setVisibleWeek(startOfWeek(day));
    setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    setCalendarOpen(false);
  }

  function changeWeek(direction: number) {
    const next = addDays(selectedDate, direction * 7);

    selectDay(next);
  }

  function changeMonth(direction: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }

  function openCalendar() {
    setVisibleMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );

    setCalendarOpen(true);
  }

  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.fixedArea,
          {
            paddingTop: insets.top + spacing[5],
            borderBottomColor: colors.divider,
          },
        ]}
      >
        {/* Page header */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              Your little wins 💜
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              A look back at your eating moments.
            </Text>
          </View>

          <Pressable
            onPress={openCalendar}
            accessibilityRole="button"
            accessibilityLabel="Open full calendar"
            style={[
              styles.calendarButton,
              {
                backgroundColor: colors.primaryLight,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={23}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {/* Week navigation */}

        <View style={styles.weekHeader}>
          <Pressable
            onPress={() => changeWeek(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-back" size={21} color={colors.primary} />
          </Pressable>

          <Text style={[styles.weekTitle, { color: colors.text }]}>
            {formatWeekRange(weekDays)}
          </Text>

          <Pressable
            onPress={() => changeWeek(1)}
            accessibilityRole="button"
            accessibilityLabel="Next week"
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={21} color={colors.primary} />
          </Pressable>
        </View>

        {/* Seven-day calendar */}

        <View style={styles.weekStrip}>
          {weekDays.map((day) => {
            const key = dateKey(day);

            return (
              <View key={key} style={styles.weekCell}>
                <CalendarDayCard
                  date={day}
                  count={counts[dateKey(day)] ?? 0}
                  target={target}
                  selected={dateKey(day) === selectedKey}
                  onPress={() => selectDay(day)}
                />
              </View>
            );
          })}
        </View>

        {/* Completion color legend */}

        <View style={styles.legend}>
          <LegendItem
            color={palette.purple[600]}
            label="Target met"
            textColor={colors.textSecondary}
          />

          <LegendItem
            color={colors.primaryLight}
            label="Some check-ins"
            textColor={colors.textSecondary}
          />

          <LegendItem
            color={colors.surface}
            borderColor={colors.border}
            label="No records"
            textColor={colors.textSecondary}
          />
        </View>

        {/* Selected date header */}

        <View style={styles.daySectionHeader}>
          <Text style={[styles.dayTitle, { color: colors.text }]}>
            {selectedDateLabel}
          </Text>

          <Text style={[styles.dayCount, { color: colors.primary }]}>
            {loading ? "Loading..." : `${selectedEvents.length} check-ins`}
          </Text>
        </View>
      </View>

      {/* check-in section */}

      <ScrollView
        style={styles.checkInsScroll}
        contentContainerStyle={[
          styles.checkInsContent,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 115,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.loadingIndicator}
          />
        ) : selectedEvents.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="heart-outline" size={28} color={colors.primary} />

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nothing recorded yet
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              No eating check-ins were recorded for this day.
            </Text>
          </View>
        ) : (
          <CheckInTimeline events={selectedEvents} windows={eatingWindows} />
        )}
      </ScrollView>

      {/* =========================================
          FULL MONTH CALENDAR MODAL
      ========================================= */}

      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCalendarOpen(false)}
      >
        <View style={styles.modalRoot}>
          {/* Tap outside to dismiss */}

          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCalendarOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close calendar"
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
            <View style={styles.modalHandle} />

            {/* Modal heading */}

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose a day
              </Text>

              <Pressable
                onPress={() => setCalendarOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close calendar"
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={23} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Month navigation */}

            <View style={styles.monthHeader}>
              <Pressable
                onPress={() => changeMonth(-1)}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                style={styles.arrowButton}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>

              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {monthLabel}
              </Text>

              <Pressable
                onPress={() => changeMonth(1)}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                style={styles.arrowButton}
              >
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            {/* Scrollable month grid */}

            <ScrollView
              style={styles.monthScroll}
              contentContainerStyle={styles.monthScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.monthGrid}>
                {monthDays.map((day) => {
                  const key = dateKey(day);

                  const outsideMonth =
                    day.getMonth() !== visibleMonth.getMonth() ||
                    day.getFullYear() !== visibleMonth.getFullYear();

                  return (
                    <View key={key} style={styles.monthCell}>
                      <CalendarDayCard
                        date={day}
                        compact
                        count={counts[key] ?? 0}
                        target={target}
                        selected={key === selectedKey}
                        outsideMonth={outsideMonth}
                        onPress={() => selectDay(day)}
                      />
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Return to today */}

            <Pressable
              onPress={() => selectDay(new Date())}
              accessibilityRole="button"
              style={[
                styles.todayButton,
                {
                  backgroundColor: colors.primaryLight,
                },
              ]}
            >
              <Text style={[styles.todayButtonText, { color: colors.primary }]}>
                Jump to today
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LegendItem({
  color,
  label,
  textColor,
  borderColor,
}: {
  color: string;
  label: string;
  textColor: string;
  borderColor?: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
            borderColor: borderColor ?? color,
          },
        ]}
      />

      <Text
        style={{
          color: textColor,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  fixedArea: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[5],
    borderBottomWidth: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerText: {
    flex: 1,
    gap: 5,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },

  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  weekTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 105,
  },

  arrowButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  weekStrip: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 3,
  },

  weekCell: {
    flex: 1,
    minWidth: 0,
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
  },

  daySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  dayTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },

  dayCount: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Scrollable check-ins

  checkInsScroll: {
    flex: 1,
  },

  checkInsContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },

  loadingIndicator: {
    marginTop: 30,
  },

  eventList: {
    gap: 10,
  },

  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },

  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  eventDetails: {
    flex: 1,
    gap: 4,
  },

  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  eventTime: {
    fontSize: 12,
  },

  emptyCard: {
    minHeight: 155,
    borderRadius: radius.xl,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  emptyDescription: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },

  // Full-month modal

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 16, 33, 0.55)",
  },

  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 18,
    maxHeight: "90%",
  },

  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#C7BDD5",
    alignSelf: "center",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  monthScroll: {
    flexShrink: 1,
    flexGrow: 0,
  },

  monthScrollContent: {
    paddingVertical: 4,
  },

  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    paddingVertical: 8,
  },

  monthCell: {
    width: "14.2857%",
    paddingHorizontal: 3,
  },

  todayButton: {
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  todayButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
