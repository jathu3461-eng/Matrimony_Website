import { useEffect, useState } from 'react';
import { chatApi } from '@/api/chat';
import { notificationApi } from '@/api/notifications';
import { useAppSelector } from '@/store/hooks';

/**
 * Polls unread chat + notification counts for the tab badge.
 */
export function useUnreadBadge(pollMs = 30000) {
  const authenticated = useAppSelector((s) => s.auth.status === 'authenticated');
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;

    const refresh = async () => {
      try {
        const [chatTotal, notifTotal] = await Promise.all([
          chatApi.unread(),
          notificationApi.unreadCount(),
        ]);
        if (active) {
          setBadge(chatTotal + notifTotal);
        }
      } catch {
        // ignore transient polling errors
      }
    };

    refresh();
    const id = setInterval(refresh, pollMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [authenticated, pollMs]);

  return badge;
}
