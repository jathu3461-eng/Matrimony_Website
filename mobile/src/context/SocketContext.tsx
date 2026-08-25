import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { connectSocket, disconnectSocket, getSocket } from '@/services/chatSocket';
import { useAppSelector } from '@/store/hooks';

interface PresenceInfo {
  online: boolean;
  lastSeen: string | null;
}

type SocketHandler = (...args: any[]) => void;

interface SocketContextValue {
  connected: boolean;
  getPresence: (userId: number | string) => PresenceInfo;
  isOnline: (userId: number | string) => boolean;
  subscribe: (event: string, handler: SocketHandler) => () => void;
}

const SocketContext = createContext<SocketContextValue>({
  connected: false,
  getPresence: () => ({ online: false, lastSeen: null }),
  isOnline: () => false,
  subscribe: () => () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const [connected, setConnected] = useState(false);
  const presenceRef = useRef<Map<string, PresenceInfo>>(new Map());
  const listenersRef = useRef<Map<string, Set<SocketHandler>>>(new Map());
  const [, forceUpdate] = useState(0);
  const appStateRef = useRef(AppState.currentState);

  const getPresence = useCallback((userId: number | string): PresenceInfo => {
    return presenceRef.current.get(String(userId)) || { online: false, lastSeen: null };
  }, []);

  const isOnline = useCallback((userId: number | string): boolean => {
    return presenceRef.current.get(String(userId))?.online ?? false;
  }, []);

  const bump = () => forceUpdate((n) => n + 1);

  // Attach a listener to any socket event; survives reconnects and can be
  // registered before the socket exists (replayed once it connects).
  const subscribe = useCallback((event: string, handler: SocketHandler) => {
    let set = listenersRef.current.get(event);
    if (!set) {
      set = new Set();
      listenersRef.current.set(event, set);
    }
    set.add(handler);
    const s = getSocket();
    if (s) s.on(event, handler as never);
    return () => {
      set!.delete(handler);
      const sock = getSocket();
      if (sock) sock.off(event, handler as never);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setConnected(false);
      presenceRef.current.clear();
      bump();
      return;
    }

    let mounted = true;
    let syncTimer: ReturnType<typeof setInterval> | null = null;

    const applySyncResp = (resp: any) => {
      if (!mounted || !resp?.ok || !resp.onlinePartners) return;
      for (const [uid, info] of Object.entries(resp.onlinePartners) as any) {
        presenceRef.current.set(String(uid), {
          online: !!info.online,
          lastSeen: info.lastSeen || null,
        });
      }
      bump();
    };

    const syncNow = () => {
      const s = getSocket();
      s?.emit('chat:sync', {}, applySyncResp);
    };

    const setup = async () => {
      const s = await connectSocket();
      if (!s || !mounted) return;

      // Re-attach any listeners registered before the socket existed.
      for (const [evt, handlers] of listenersRef.current) {
        for (const h of handlers) s.on(evt, h as never);
      }

      s.on('connect', () => {
        if (!mounted) return;
        setConnected(true);
        syncNow();
      });

      s.on('disconnect', () => {
        if (!mounted) return;
        setConnected(false);
        // All partners become unreachable until we reconnect.
        presenceRef.current.clear();
        bump();
      });

      s.on('chat:presence', (data: { userId: number; online: boolean; lastSeen: string | null }) => {
        if (!mounted) return;
        presenceRef.current.set(String(data.userId), {
          online: data.online,
          lastSeen: data.lastSeen ?? null,
        });
        bump();
      });

      // Whoever just messaged us is obviously online right now.
      s.on('chat:message', (m: any) => {
        if (!mounted || m?.sender_user_id == null) return;
        presenceRef.current.set(String(m.sender_user_id), { online: true, lastSeen: null });
        bump();
      });

      // Keep presence fresh while the app stays open (WhatsApp-style).
      syncTimer = setInterval(syncNow, 30000);
    };

    setup();

    // Re-sync / re-connect when the app returns to the foreground.
    const handleAppState = (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        const s = getSocket();
        if (s && !s.connected) {
          s.connect(); // same socket instance keeps all handlers attached
        } else if (s?.connected) {
          syncNow();
        }
      }
      appStateRef.current = next;
    };

    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      mounted = false;
      if (syncTimer) clearInterval(syncTimer);
      sub.remove();
      disconnectSocket();
      setConnected(false);
      presenceRef.current.clear();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ connected, getPresence, isOnline, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
