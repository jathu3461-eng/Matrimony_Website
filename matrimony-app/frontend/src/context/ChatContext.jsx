import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { socketUrl } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui';

const ChatContext = createContext(null);

// Subtle two-note notification chime built with WebAudio (no asset needed).
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [[880, 0], [1108.73, 0.12]].forEach(([freq, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.12, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.25);
    });
    setTimeout(() => ctx.close(), 800);
  } catch (_) {}
}

function threadSorter(a, b) {
  const ta = a.last_at ? new Date(a.last_at).getTime() : 0;
  const tb = b.last_at ? new Date(b.last_at).getTime() : 0;
  return tb - ta;
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [threads, setThreads] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingThreads, setTypingThreads] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('mukurtham_chat_sound') !== 'off');

  const listenersRef = useRef(new Map());
  const typingTimersRef = useRef(new Map());
  const activeThreadIdRef = useRef(null); // which thread is open in the UI
  const myUserIdRef = useRef(user?.id);
  const connectedRef = useRef(false);

  myUserIdRef.current = user?.id;

  // Tiny pub/sub so pages can subscribe to raw socket events without re-renders.
  const subscribe = useCallback((event, cb) => {
    const set = listenersRef.current.get(event) || new Set();
    set.add(cb);
    listenersRef.current.set(event, set);
    return () => {
      set.delete(cb);
      if (set.size === 0) listenersRef.current.delete(event);
    };
  }, []);

  const emitLocal = useCallback((event, payload) => {
    listenersRef.current.get(event)?.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error(e); }
    });
  }, []);

  const patchThread = useCallback((thread) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.thread_id !== thread.thread_id);
      next.push(thread);
      next.sort(threadSorter);
      return next;
    });
  }, []);

  const unreadTotal = useMemo(() => threads.reduce((sum, t) => sum + (t.unread_count || 0), 0), [threads]);

  const loadThreads = useCallback(async () => {
    try {
      const res = await api.get('/chat/threads');
      const loaded = res.data.threads || [];
      setThreads((prev) => {
        const map = new Map();
        for (const t of loaded) map.set(t.thread_id, t);
        for (const t of prev) if (!map.has(t.thread_id)) map.set(t.thread_id, t);
        return [...map.values()].sort(threadSorter);
      });
    } catch (e) {
      /* ignore */
    }
  }, []);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      connectedRef.current = false;
      setConnected(false);
      setThreads([]);
      setOnlineUsers({});
      setTypingThreads({});
      typingTimersRef.current.forEach((t) => clearTimeout(t));
      typingTimersRef.current.clear();
      socket?.disconnect();
      setSocket(null);
      return;
    }
    if (socket) return;

    const s = io(socketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 8000,
    });

    const onConnect = () => {
      connectedRef.current = true;
      setConnected(true);
      // Re-sync thread list + presence + missed deliveries after (re)connect.
      s.emit('chat:sync', {}, (resp) => {
        if (resp?.ok) {
          if (Array.isArray(resp.threads)) {
            setThreads(resp.threads.sort(threadSorter));
          }
          if (resp.onlinePartners) setOnlineUsers(resp.onlinePartners);
        } else {
          loadThreads();
        }
        emitLocal('chat:connected', resp || {});
      });
    };
    const onDisconnect = () => {
      connectedRef.current = false;
      setConnected(false);
      emitLocal('chat:disconnected', {});
    };

    const onMessage = (msg) => {
      if (!msg) return;
      if (msg.sender_user_id === myUserIdRef.current) return; // own echo
      setOnlineUsers((prev) => ({ ...prev, [String(msg.sender_user_id)]: { online: true, lastSeen: null } }));
      // Toast + sound when the chat page isn't open on this thread.
      const isOpen = activeThreadIdRef.current === msg.thread_id;
      if (!isOpen) {
        if (soundEnabled) playChime();
        const preview = (msg.message || '').slice(0, 80);
        toast.info(
          <span className="flex flex-col">
            <span className="font-bold">{msg.sender_name || 'New message'}</span>
            <span className="text-xs font-normal text-[var(--ink-faint)] truncate">{preview}</span>
          </span>,
          { duration: 5000 }
        );
      }
      emitLocal('chat:message', msg);
    };
    const onThread = (thread) => {
      if (!thread) return;
      patchThread(thread);
      emitLocal('chat:thread', thread);
    };
    const onSeen = (payload) => emitLocal('chat:seen', payload);
    const onDelivered = (payload) => emitLocal('chat:delivered', payload);
    const onTyping = (payload) => {
      if (!payload || payload.threadId == null) return;
      const tid = String(payload.threadId);
      if (payload.isTyping) {
        const existing = typingTimersRef.current.get(tid);
        if (existing) clearTimeout(existing);
        setTypingThreads((prev) => ({ ...prev, [tid]: payload.name || 'Someone' }));
        const t = setTimeout(() => {
          typingTimersRef.current.delete(tid);
          setTypingThreads((prev) => {
            const next = { ...prev };
            delete next[tid];
            return next;
          });
        }, 4000);
        typingTimersRef.current.set(tid, t);
      } else {
        const existing = typingTimersRef.current.get(tid);
        if (existing) clearTimeout(existing);
        typingTimersRef.current.delete(tid);
        setTypingThreads((prev) => {
          const next = { ...prev };
          delete next[tid];
          return next;
        });
      }
      emitLocal('chat:typing', payload);
    };
    const onPresence = ({ userId, online, lastSeen }) => {
      if (userId == null) return;
      setOnlineUsers((prev) => ({ ...prev, [String(userId)]: { online: !!online, lastSeen: lastSeen || null } }));
    };
    const onInterest = (payload) => {
      if (soundEnabled && payload?.type === 'interest_accepted') playChime();
      toast.info(payload?.message || 'You have a new connection!', { duration: 5000 });
      emitLocal('chat:interest', payload);
    };
    const onError = (err) => {
      if (err?.message === 'Unauthorized') {
        // Session expired — disconnect silently; REST will handle auth.
        s.disconnect();
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onError);
    s.on('chat:message', onMessage);
    s.on('chat:thread', onThread);
    s.on('chat:seen', onSeen);
    s.on('chat:delivered', onDelivered);
    s.on('chat:typing', onTyping);
    s.on('chat:presence', onPresence);
    s.on('chat:interest', onInterest);

    setSocket(s);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onError);
      s.off('chat:message', onMessage);
      s.off('chat:thread', onThread);
      s.off('chat:seen', onSeen);
      s.off('chat:delivered', onDelivered);
      s.off('chat:typing', onTyping);
      s.off('chat:presence', onPresence);
      s.off('chat:interest', onInterest);
      s.disconnect();
      connectedRef.current = false;
      setConnected(false);
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    ({ profileA, profileB, senderProfileId, text }) =>
      new Promise((resolve) => {
        const clientId = crypto.randomUUID();
        if (socket && connectedRef.current) {
          socket.emit('chat:send', { clientId, profileA, profileB, senderProfileId, text }, (resp) => {
            if (resp?.ok) resolve({ ok: true, message: resp.message, clientId });
            else resolve({ ok: false, error: resp?.error || 'Failed to send message', clientId });
          });
        } else {
          // Fallback: REST path (also broadcasts live via the server).
          api
            .post(`/chat/${profileA}/${profileB}`, { message: text, sender_profile_id: senderProfileId, client_id: clientId })
            .then((res) => resolve({ ok: true, message: res.data.message, clientId }))
            .catch((err) => resolve({ ok: false, error: err.response?.data?.error || 'Offline — message not sent', clientId }));
        }
      }),
    [socket]
  );

  const markThreadRead = useCallback(
    ({ profileA, profileB }) => {
      if (socket && connectedRef.current) {
        socket.emit('chat:read', { profileA, profileB }, () => {});
      }
    },
    [socket]
  );

  const setTyping = useCallback(
    ({ profileA, profileB, isTyping }) => {
      if (socket && connectedRef.current) {
        socket.emit('chat:typing', { profileA, profileB, isTyping }, () => {});
      }
    },
    [socket]
  );

  const setActiveChat = useCallback((threadId) => {
    activeThreadIdRef.current = threadId || null;
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('mukurtham_chat_sound', next ? 'on' : 'off');
      return next;
    });
  }, []);

  // Sync presence when the page visibility changes (tab refocus → server may
  // have reconnected already; refresh online states via a lightweight sync).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && socket && connectedRef.current) {
        socket.emit('chat:sync', {}, (resp) => {
          if (resp?.ok && resp.onlinePartners) setOnlineUsers(resp.onlinePartners);
        });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [socket]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      threads,
      unreadTotal,
      onlineUsers,
      typingThreads,
      soundEnabled,
      subscribe,
      sendMessage,
      markThreadRead,
      setTyping,
      setActiveChat,
      loadThreads,
      toggleSound,
    }),
    [socket, connected, threads, unreadTotal, onlineUsers, typingThreads, soundEnabled, subscribe, sendMessage, markThreadRead, setTyping, setActiveChat, loadThreads, toggleSound]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
