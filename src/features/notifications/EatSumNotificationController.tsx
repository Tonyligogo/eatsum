import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect } from "react";
import { AppState } from "react-native";

import {
    ACTION_COOK,
    ACTION_REVIEW,
    ACTION_SNOOZE,
    setupNotificationCategories,
    type NotificationWindowId,
} from "./notification-service";
import {
    reconcileEatingNotifications,
    snoozePreparation,
} from "./reminder-schedule";

function validWindow(value: unknown): value is NotificationWindowId {
  return value === "breakfast" || value === "lunch" || value === "dinner";
}

export function EatSumNotificationController() {
  const db = useSQLiteContext();

  useEffect(() => {
    let disposed = false;
    let lastHandledId: string | null = null;

    async function refresh() {
      try {
        await setupNotificationCategories();
        await reconcileEatingNotifications(db);
      } catch (error) {
        console.error("Notification synchronization failed:", error);
      }
    }

    async function handleResponse(
      response: Notifications.NotificationResponse,
    ) {
      try {
        const { notification, actionIdentifier } = response;
        const data = notification.request.content.data;
        const notificationId = notification.request.identifier;

        const responseId = `${notificationId}:${actionIdentifier}`;

        if (lastHandledId === responseId) return;
        lastHandledId = responseId;

        if (data?.type === "PREP") {
          const windowId = data.windowId;

          if (!validWindow(windowId)) return;

          if (actionIdentifier === ACTION_SNOOZE) {
            if (typeof data.dayKey === "string") {
              await snoozePreparation(db, windowId, data.dayKey);
            }

            return;
          }

          if (
            actionIdentifier === ACTION_COOK ||
            actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
          ) {
            router.push({
              pathname: "/cooking",
              params: { window: windowId },
            });

            return;
          }
        }

        if (
          data?.type === "REVIEW" &&
          (actionIdentifier === ACTION_REVIEW ||
            actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER)
        ) {
          router.replace("/(tabs)/home");
        }
      } finally {
        Notifications.clearLastNotificationResponse();
      }
    }

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        void handleResponse(response).catch(console.error);
      });

    // Handle a notification that opened the app
    // from a previously closed state.
    const lastResponse = Notifications.getLastNotificationResponse();

    if (lastResponse) {
      void handleResponse(lastResponse).catch(console.error);
    }

    // Reconcile when the app becomes active.
    const appSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !disposed) {
        void refresh();
      }
    });

    void refresh();

    return () => {
      disposed = true;
      responseSubscription.remove();
      appSubscription.remove();
    };
  }, [db]);

  return null;
}
