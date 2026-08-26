import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { chatApi } from '@/api/chat';
import { notificationApi } from '@/api/notifications';
import { interestApi } from '@/api/interests';
import { useAppSelector } from '@/store/hooks';
import { useSocket } from '@/context/SocketContext';
import { badgeEvents } from '@/lib/badgeEvents';

function safeNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

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
      const results = await Promise.allSettled([
        chatApi.unread(),
        notificationApi.unreadCount(),
        interestApi.myInteractions(),
      ]);

      const chatResult = results[0];
      const notifResult = results[1];
      const interestResult = results[2];

      if (chatResult.status === 'fulfilled') {
        setChatCount(safeNumber(chatResult.value));
      }

      if (notifResult.status === 'fulfilled') {
        setNotifCount(safeNumber(notifResult.value));
      } else {
        setNotifCount(0);
      }

      if (interestResult.status === 'fulfilled') {
        const interactions = interestResult.value;
        const pendingReceived = Array.isArray(interactions?.received)
          ? interactions.received.filter((i: any) => i?.status === 'pending').length
          : 0;
        setInterestCount(pendingReceived);
      }
    } catch {
      setChatCount(0);
      setNotifCount(0);
      setInterestCount(0);
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

    const offBadge = badgeEvents.on('notifications:read', () => {
      setNotifCount(0);
      refresh();
    });

    return () => {
      clearInterval(id);
      appSub.remove();
      offs.forEach((off) => off());
      offBadge();
    };
  }, [authenticated, pollMs, refresh, subscribe, connected]);

  return { chatCount, notifCount, interestCount };
}
