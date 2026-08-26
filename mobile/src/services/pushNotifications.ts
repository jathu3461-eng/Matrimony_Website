import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '@/api/client';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

let notificationHandler: {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: () => Promise<{ data: string }>;
  addNotificationReceivedListener: (cb: (n: any) => void) => { remove: () => void };
  addNotificationResponseReceivedListener: (cb: (r: any) => void) => { remove: () => void };
  setNotificationHandler: (h: any) => void;
} | null = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    notificationHandler = require('expo-notifications');
    notificationHandler!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // expo-notifications not available (Expo Go)
  }
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!notificationHandler) return null;
  try {
    const { status: existingStatus } = await notificationHandler.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await notificationHandler.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const tokenData = await notificationHandler.getExpoPushTokenAsync();
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
  onReceive?: (notification: any) => void,
  onForegroundTap?: (notification: any) => void,
) {
  if (!notificationHandler) return () => {};

  const receivedSub = notificationHandler.addNotificationReceivedListener((n: any) => {
    onReceive?.(n);
  });

  const responseSub = notificationHandler.addNotificationResponseReceivedListener((r: any) => {
    onForegroundTap?.(r);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
