import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { chatApi } from '@/api/chat';
import { notificationApi } from '@/api/notifications';
import { useAppSelector } from '@/store/hooks';
import { useSocket } from '@/context/SocketContext';

/**
 * Live unread badge count (chats + notifications).
 * Updates instantly on socket activity (WhatsApp-style), with polling as a
 * safety net for missed events.
 */
export function useUnreadBadge(pollMs = 60000) {
  const authenticated = useAppSelector((s) => s.auth.status === 'authenticated');
  const { subscribe, connected } = useSocket();
  const [badge, setBadge] = useState(0);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const [chatTotal, notifTotal] = await Promise.all([
        chatApi.unread(),
        notificationApi.unreadCount(),
      ]);
      setBadge(chatTotal + notifTotal);
    } catch {
      // ignore transient errors
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setBadge(0);
      return;
    }

    refresh();
    const id = setInterval(refresh, pollMs);

    const appSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') refresh();
    });

    // Real-time: refresh the moment any chat/notification event arrives.
    const events = ['chat:message', 'chat:thread', 'chat:seen', 'chat:read'];
    const offs = events.map((evt) => subscribe(evt, () => refresh()));

    return () => {
      clearInterval(id);
      appSub.remove();
      offs.forEach((off) => off());
    };
  }, [authenticated, pollMs, refresh, subscribe, connected]);

  return badge;
}
