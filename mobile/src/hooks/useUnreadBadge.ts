import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { chatApi } from '@/api/chat';
import { notificationApi } from '@/api/notifications';
import { interestApi } from '@/api/interests';
import { useAppSelector } from '@/store/hooks';
import { useSocket } from '@/context/SocketContext';
import { badgeEvents } from '@/lib/badgeEvents';

/**
 * Live unread counts for chat, notifications, and pending interests,
 * updated in real-time via socket events with polling fallback.
 */
export function useUnreadBadge(pollMs = 30000) {
  const authenticated = useAppSelector((s) => s.auth.status === 'authenticated');
  const { subscribe, connected } = useSocket();
  const [chatCount, setChatCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const [chat, notif, interactions] = await Promise.all([
        chatApi.unread(),
        notificationApi.unreadCount(),
        interestApi.myInteractions(),
      ]);
      setChatCount(chat);
      setNotifCount(notif);
      const pendingReceived = interactions.received.filter(
        (i) => i.status === 'pending',
      ).length;
      setInterestCount(pendingReceived);
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
      setInterestCount(0);
      return;
    }

    refresh();
    const id = setInterval(refresh, pollMs);

    const appSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') refresh();
    });

    const events = [
      'chat:message', 'chat:thread', 'chat:seen', 'chat:read',
      'interest:received', 'interest:responded',
    ];
    const offs = events.map((evt) => subscribe(evt, () => refresh()));

    const offBadge = badgeEvents.on('notifications:read', refresh);

    return () => {
      clearInterval(id);
      appSub.remove();
      offs.forEach((off) => off());
      offBadge();
    };
  }, [authenticated, pollMs, refresh, subscribe, connected]);

  return { chatCount, notifCount, interestCount };
}
