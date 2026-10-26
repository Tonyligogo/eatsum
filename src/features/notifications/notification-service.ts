import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const PREP_CATEGORY = "EATSUM_PREP";
export const REVIEW_CATEGORY = "EATSUM_REVIEW";

export const ACTION_COOK = "EATSUM_COOK";
export const ACTION_SNOOZE = "EATSUM_SNOOZE";
export const ACTION_REVIEW = "EATSUM_OPEN_REVIEW";

export type NotificationWindowId = "breakfast" | "lunch" | "dinner";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(PREP_CATEGORY, [
    {
      identifier: ACTION_COOK,
      buttonTitle: "Let's get on it",
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: ACTION_SNOOZE,
      buttonTitle: "Remind me later",
      options: {
        opensAppToForeground: true,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync(REVIEW_CATEGORY, [
    {
      identifier: ACTION_REVIEW,
      buttonTitle: "Review my day",
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
}

export async function hasNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();

  if (Platform.OS === "ios") {
    return (
      settings.ios?.status ===
        Notifications.IosAuthorizationStatus.AUTHORIZED ||
      settings.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }

  return settings.granted;
}

export async function requestNotificationPermission() {
  const current = await hasNotificationPermission();

  if (current) return true;

  const result = await Notifications.requestPermissionsAsync();

  if (Platform.OS === "ios") {
    return (
      result.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      result.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }

  return result.granted;
}

export async function scheduleTestNotification() {
  await setupNotificationCategories();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Hey, chef! 💜",
      body: "Let's make something delicious.",
      categoryIdentifier: PREP_CATEGORY,
      data: {
        type: "PREP",
        windowId: "lunch",
      },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}
