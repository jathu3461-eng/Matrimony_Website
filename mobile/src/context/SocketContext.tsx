import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { connectSocket, disconnectSocket, getSocket } from '@/services/chatSocket';
import { useAppSelector } from '@/store/hooks';

interface PresenceInfo {
  online: boolean;
  lastSeen: string | null;
}

interface SocketContextValue {
  connected: boolean;
  getPresence: (userId: number | string) => PresenceInfo;
  isOnline: (userId: number | string) => boolean;
}

const SocketContext = createContext<SocketContextValue>({
  connected: false,
  getPresence: () => ({ online: false, lastSeen: null }),
  isOnline: () => false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const [connected, setConnected] = useState(false);
  const presenceRef = useRef<Map<string, PresenceInfo>>(new Map());
  const [, forceUpdate] = useState(0);
  const appStateRef = useRef(AppState.currentState);

  const getPresence = useCallback((userId: number | string): PresenceInfo => {
    return presenceRef.current.get(String(userId)) || { online: false, lastSeen: null };
  }, []);

  const isOnline = useCallback((userId: number | string): boolean => {
    return presenceRef.current.get(String(userId))?.online ?? false;
  }, []);

  const bump = () => forceUpdate((n) => n + 1);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setConnected(false);
      presenceRef.current.clear();
      bump();
      return;
    }

    let mounted = true;

    const setup = async () => {
      const s = await connectSocket();
      if (!s || !mounted) return;

      s.on('connect', () => {
        if (!mounted) return;
        setConnected(true);
        s.emit('chat:sync', {}, (resp: any) => {
          if (!mounted) return;
          if (resp?.ok && resp.onlinePartners) {
            for (const [uid, info] of Object.entries(resp.onlinePartners) as any) {
              presenceRef.current.set(String(uid), {
                online: info.online,
                lastSeen: info.lastSeen || null,
              });
            }
            bump();
          }
        });
      });

      s.on('disconnect', () => {
        if (!mounted) return;
        setConnected(false);
      });

      s.on('chat:presence', (data: { userId: number; online: boolean; lastSeen: string | null }) => {
        if (!mounted) return;
        presenceRef.current.set(String(data.userId), {
          online: data.online,
          lastSeen: data.lastSeen,
        });
        bump();
      });
    };

    setup();

    // Re-sync presence when app returns to foreground
    const handleAppState = (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        const s = getSocket();
        if (s?.connected) {
          s.emit('chat:sync', {}, (resp: any) => {
            if (resp?.ok && resp.onlinePartners) {
              for (const [uid, info] of Object.entries(resp.onlinePartners) as any) {
                presenceRef.current.set(String(uid), {
                  online: info.online,
                  lastSeen: info.lastSeen || null,
                });
              }
              bump();
            }
          });
        }
      }
      appStateRef.current = next;
    };

    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      mounted = false;
      sub.remove();
      disconnectSocket();
      setConnected(false);
      presenceRef.current.clear();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ connected, getPresence, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
