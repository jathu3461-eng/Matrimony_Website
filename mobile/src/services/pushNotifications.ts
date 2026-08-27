export async function registerPushToken(): Promise<void> {}

export function setupNotificationListeners(
  _onReceive?: (notification: any) => void,
  _onForegroundTap?: (notification: any) => void,
) {
  return () => {};
}
