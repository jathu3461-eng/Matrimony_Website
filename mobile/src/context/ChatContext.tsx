import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat';
import { API_BASE_URL } from '@/api/client';
import { tokenStorage } from '@/services/tokenStorage';
import { useAppSelector } from '@/store/hooks';
import type { ChatMessage } from '@/types';

// Backend socket server runs at the API origin (same server, /socket mnt not used —
// the Node server serves socket.io on the root of the API domain).
const SOCKET_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL.replace(/\/$/, '');

type OnlineState = { online: boolean; lastSeen: string | null };

interface ChatContextValue {
  connected: boolean;
  onlinePartners: Record<string, OnlineState>;
  typing: Record<string, string>;
  sendMessage: (params: {
    profileA: number | string;
    profileB: number | string;
    senderProfileId: number | string;
    text: string;
    clientId?: string;
  }) => Promise<ChatMessage>;
  markRead: (profileA: number | string, profileB: number | string) => void;
  sendTyping: (profileA: number | string, profileB: number | string, isTyping: boolean) => void;
  subscribeToThread: (key: string, cb: (msg: ChatMessage) => void) => () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function threadKey(profileA: number | string, profileB: number | string): string {
  const [a, b] = [Number(profileA), Number(profileB)].sort((x, y) => x - y);
  return `${a}:${b}`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const authenticated = useAppSelector((s) => s.auth.status === 'authenticated');
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(msg: ChatMessage) => void>>>(new Map());

  const [connected, setConnected] = useState(false);
  const [onlinePartners, setOnlinePartners] = useState<Record<string, OnlineState>>({});
  const [typing, setTyping] = useState<Record<string, string>>({});

  // Subscribe a screen to realtime messages for a specific thread.
  const subscribeToThread = useCallback(
    (key: string, cb: (msg: ChatMessage) => void) => {
      let set = listenersRef.current.get(key);
      if (!set) {
        set = new Set();
        listenersRef.current.set(key, set);
      }
      set.add(cb);
      return () => {
        set?.delete(cb);
      };
    },
    []
  );

  // Deliver an incoming message to thread subscribers + refresh the thread list.
  const onIncomingMessage = useCallback(
    (msg: ChatMessage) => {
      const key = threadKey(msg.sender_profile_id, msg.receiver_profile_id);
      listenersRef.current.get(key)?.forEach((cb) => cb(msg));
      queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread'] });
    },
    [queryClient]
  );

  // Connect once the user is authenticated.
  useEffect(() => {
    if (!authenticated) return;

    let disposed = false;
    let socket: Socket | null = null;

    (async () => {
      const token = await tokenStorage.getAccessToken();
      if (disposed || !token) return;

      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });
      socketRef.current = socket;
      const s = socket;

      s.on('connect', () => {
        if (disposed) return;
        setConnected(true);
        s.emit('chat:sync', {}, () => {});
      });

      s.on('disconnect', () => {
        if (!disposed) setConnected(false);
      });

      s.on('connect_error', () => {
        // token may have been refreshed; retry is handled by socket.io
      });

      s.on('chat:ready', () => {});

      s.on('chat:message', onIncomingMessage);

      s.on('chat:sync', (_payload) => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
      });

      s.on('chat:seen', () => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
      });

      s.on('chat:delivered', () => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
      });

      s.on('chat:presence', (payload: { userId: number; online: boolean; lastSeen: string | null }) => {
        setOnlinePartners((prev) => ({
          ...prev,
          [String(payload.userId)]: { online: payload.online, lastSeen: payload.lastSeen ?? null },
        }));
      });

      s.on(
        'chat:typing',
        (payload: { threadId: string; name: string; isTyping: boolean }) => {
          setTyping((prev) => {
            const next = { ...prev };
            if (payload.isTyping) next[payload.threadId] = payload.name;
            else delete next[payload.threadId];
            return next;
          });
        }
      );
    })();

    return () => {
      disposed = true;
      socketRef.current = null;
      socket?.disconnect();
      setConnected(false);
      setOnlinePartners({});
      setTyping({});
    };
  }, [authenticated, onIncomingMessage, queryClient]);

  // Send a message over socket with a REST fallback if the socket is down.
  const sendMessage = useCallback(
    async ({
      profileA,
      profileB,
      senderProfileId,
      text,
      clientId,
    }: {
      profileA: number | string;
      profileB: number | string;
      senderProfileId: number | string;
      text: string;
      clientId?: string;
    }): Promise<ChatMessage> => {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        return new Promise((resolve, reject) => {
          socket.emit(
            'chat:send',
            {
              text,
              profileA: Number(profileA),
              profileB: Number(profileB),
              senderProfileId: Number(senderProfileId),
              clientId: clientId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            },
            (ack: { ok: boolean; message?: ChatMessage; error?: string }) => {
              if (ack?.ok && ack.message) resolve(ack.message);
              else reject(new Error(ack?.error || 'Failed to send message'));
            }
          );
        });
      }
      return chatApi.send(profileA, profileB, text, senderProfileId, clientId);
    },
    []
  );

  const markRead = useCallback((profileA: number | string, profileB: number | string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('chat:read', { profileA: Number(profileA), profileB: Number(profileB) }, () => {});
    }
  }, []);

  const sendTyping = useCallback(
    (profileA: number | string, profileB: number | string, isTyping: boolean) => {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit(
          'chat:typing',
          { profileA: Number(profileA), profileB: Number(profileB), isTyping },
          () => {}
        );
      }
    },
    []
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      connected,
      onlinePartners,
      typing,
      sendMessage,
      markRead,
      sendTyping,
      subscribeToThread,
    }),
    [connected, onlinePartners, typing, sendMessage, markRead, sendTyping, subscribeToThread]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

/**
 * Live-subscribe a chat thread (identified by its two profile ids) to incoming
 * messages. Returns a callback that merges a new server message into state.
 */
export function useChatThread(
  profileA: number | string,
  profileB: number | string,
  onMessage: (msg: ChatMessage) => void
) {
  const { subscribeToThread } = useChat();
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    return subscribeToThread(threadKey(profileA, profileB), (msg) => cbRef.current(msg));
  }, [subscribeToThread, profileA, profileB]);
}