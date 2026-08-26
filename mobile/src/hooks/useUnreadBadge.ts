import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { chatApi } from '@/api/chat';
import { notificationApi } from '@/api/notifications';
import { useAppSelector } from '@/store/hooks';
import { useSocket } from '@/context/SocketContext';

/**
 * Live unread counts for chat and notifications, updated in real-time via
 * socket events with polling fallback. Returns { chat, notif } separately
 * so each tab can show its own badge.
 */
export function useUnreadBadge(pollMs = 30000) {
  const authenticated = useAppSelector((s) => s.auth.status === 'authenticated');
  const { subscribe, connected } = useSocket();
  const [chatCount, setChatCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const [chat, notif] = await Promise.all([
        chatApi.unread(),
        notificationApi.unreadCount(),
      ]);
      setChatCount(chat);
      setNotifCount(notif);
    } catch {
      // ignore transient errors
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setChatCount(0);
      setNotifCount(0);
      return;
    }

    refresh();
    const id = setInterval(refresh, pollMs);

    const appSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') refresh();
    });

    const events = ['chat:message', 'chat:thread', 'chat:seen', 'chat:read'];
    const offs = events.map((evt) => subscribe(evt, () => refresh()));

    return () => {
      clearInterval(id);
      appSub.remove();
      offs.forEach((off) => off());
    };
  }, [authenticated, pollMs, refresh, subscribe, connected]);

  return { chatCount, notifCount };
}
