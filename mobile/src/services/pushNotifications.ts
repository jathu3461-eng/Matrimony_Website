import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '@/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

export async function registerPushToken(): Promise<void> {
  try {
    const token = await registerForPushNotifications();
    if (!token) return;

    await api.post('/notifications/push-token', { token, platform: Platform.OS });
  } catch {
    // Silent fail - push notifications are non-critical
  }
}

export function setupNotificationListeners(
  onReceive?: (notification: Notifications.Notification) => void,
  onForegroundTap?: (notification: Notifications.NotificationResponse) => void,
) {
  const receivedSub = Notifications.addNotificationReceivedListener((n) => {
    onReceive?.(n);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((r) => {
    onForegroundTap?.(r);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
