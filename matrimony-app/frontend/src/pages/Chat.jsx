import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MessagesSquare,
  Send,
  Check,
  CheckCheck,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { Button, Spinner } from "../components/ui";

const PAGE_SIZE = 50;

function formatTime(t) {
  if (!t) return "";
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(t) {
  if (!t) return "";
  const d = new Date(t);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatListDate(t) {
  if (!t) return "";
  const d = new Date(t);
  const today = new Date();
  const diff = Math.floor((today - d) / 86400000);
  if (diff < 1) return formatTime(t);
  if (diff < 2) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatLastSeen(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (diff < 1) return "last seen just now";
  if (diff < 60) return `last seen ${diff} min ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `last seen ${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `last seen ${days} d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function MessageStatus({ msg }) {
  let icon = null;
  let cls = "text-[var(--ink-faint)]";
  if (msg._error) {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--error)]" title="Not delivered — tap to retry">
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (msg._temp) {
    icon = <Clock className="w-3.5 h-3.5" aria-hidden="true" />;
  } else if (msg.read_at) {
    icon = <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />;
    cls = "text-[var(--primary)]";
  } else if (msg.delivered_at) {
    icon = <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />;
  } else {
    icon = <Check className="w-3.5 h-3.5" aria-hidden="true" />;
  }
  return (
    <span className={`inline-flex items-center ${cls}`} aria-label={msg._temp ? "Sending" : msg.read_at ? "Read" : msg.delivered_at ? "Delivered" : "Sent"}>
      {icon}
    </span>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const {
    socket,
    connected,
    threads,
    onlineUsers,
    typingThreads,
    soundEnabled,
    subscribe,
    sendMessage,
    markThreadRead,
    setTyping,
    setActiveChat,
    toggleSound,
  } = useChat();
  const navigate = useNavigate();
  const { threadId: urlThreadId } = useParams();

  const [myProfiles, setMyProfiles] = useState([]);
  const [myProfileId, setMyProfileId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [typingName, setTypingName] = useState(null);

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const activeThreadRef = useRef(null);
  const myProfileIdRef = useRef(null);
  const messagesRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const typingTimerRef = useRef(null);
  const openKeyRef = useRef(null);
  const nearBottomRef = useRef(true);

  myProfileIdRef.current = myProfileId;
  messagesRef.current = messages;
  hasMoreRef.current = hasMore;
  loadingOlderRef.current = loadingOlder;

  const myProfileIds = useMemo(() => myProfiles.map((p) => p.id), [myProfiles]);

  const otherSide = useCallback(
    (thread) => {
      const mine = myProfileIds.includes(thread.sender_profile_id) ? thread.sender_profile_id : thread.receiver_profile_id;
      const isSender = mine === thread.sender_profile_id;
      return {
        otherProfileId: isSender ? thread.receiver_profile_id : thread.sender_profile_id,
        otherName: isSender ? thread.receiver_name : thread.sender_name,
        otherUserId: isSender ? thread.receiver_user_id : thread.sender_user_id,
      };
    },
    [myProfileIds]
  );

  const isMine = useCallback(
    (msg) => myProfileIds.some((id) => id === msg.sender_profile_id),
    [myProfileIds]
  );

  // Load my profiles once (needed to pick the sender identity).
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    api
      .get("/profiles/mine")
      .then((res) => {
        const profiles = res.data.profiles || [];
        setMyProfiles(profiles);
        setMyProfileId((prev) => prev || profiles[0]?.id || null);
      })
      .catch(console.error);
  }, [user, navigate]);

  // ── Message fetching helpers ──────────────────────────────────────────────
  const fetchPage = useCallback(
    async (thread, { before } = {}) => {
      const profileA = thread.sender_profile_id;
      const profileB = thread.receiver_profile_id;
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (before) params.set("before", String(before));
      const res = await api.get(`/chat/${profileA}/${profileB}?${params.toString()}`);
      return res.data.messages || [];
    },
    []
  );

  const openThread = useCallback(
    async (thread) => {
      if (!thread) return;
      setActiveThread(thread);
      activeThreadRef.current = thread;
      setActiveChat(thread.thread_id);
      const memberId = myProfileIds.includes(thread.sender_profile_id) ? thread.sender_profile_id : thread.receiver_profile_id;
      if (memberId && myProfileIdRef.current !== memberId) setMyProfileId(memberId);
      const key = thread.thread_id;
      openKeyRef.current = key;
      setMessages([]);
      setHasMore(false);
      setTypingName(null);
      setLoadingMsgs(true);
      try {
        const page = await fetchPage(thread);
        if (openKeyRef.current !== key) return;
        setMessages(page);
        setHasMore(page.length >= PAGE_SIZE);
        nearBottomRef.current = true;
        markThreadRead({ profileA: thread.sender_profile_id, profileB: thread.receiver_profile_id });
      } catch (e) {
        console.error(e);
      } finally {
        if (openKeyRef.current === key) setLoadingMsgs(false);
      }
    },
    [fetchPage, markThreadRead, setActiveChat, myProfileIds]
  );

  const loadOlder = useCallback(async () => {
    const thread = activeThreadRef.current;
    if (!thread || loadingOlderRef.current || !hasMoreRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    const before = messagesRef.current[0]?.id;
    try {
      const older = await fetchPage(thread, { before });
      if (older.length > 0) {
        const known = new Set(messagesRef.current.map((m) => m.id));
        setMessages((prev) => [...older.filter((m) => !known.has(m.id)), ...prev]);
        setHasMore(older.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [fetchPage]);

  // ── Live events ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onMessage = (msg) => {
      const cur = activeThreadRef.current;
      if (!cur || msg.thread_id !== cur.thread_id) return;
      // My own message from another device / ack echo → replace the optimistic one.
      const known = new Set(messagesRef.current.map((m) => m.id));
      if (known.has(msg.id)) return;
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !(m.client_id && m.client_id === msg.client_id && !m.id));
        return [...withoutTemp, msg];
      });
      setTypingName(null);
      // The receiver marks the thread as read immediately while it's open.
      markThreadRead({ profileA: cur.sender_profile_id, profileB: cur.receiver_profile_id });
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
      });
    };

    const onDelivered = ({ threadId, messageIds }) => {
      if (!activeThreadRef.current || threadId !== activeThreadRef.current.thread_id) return;
      const ids = new Set(messageIds || []);
      if (ids.size === 0) return;
      setMessages((prev) => prev.map((m) => (ids.has(m.id) && !m.read_at ? { ...m, delivered_at: m.delivered_at || new Date().toISOString() } : m)));
    };

    const onSeen = ({ threadId, messageIds }) => {
      if (!activeThreadRef.current || threadId !== activeThreadRef.current.thread_id) return;
      const ids = new Set(messageIds || []);
      if (ids.size === 0) return;
      setMessages((prev) => prev.map((m) => (ids.has(m.id) ? { ...m, read_at: new Date().toISOString() } : m)));
    };

    const onTyping = ({ threadId, isTyping, name }) => {
      const cur = activeThreadRef.current;
      if (!cur || threadId !== cur.thread_id) return;
      if (isTyping) {
        setTypingName(name);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingName(null), 4000);
      } else {
        setTypingName(null);
      }
    };

    const onConnected = () => {
      const thread = activeThreadRef.current;
      if (thread) openThread(thread);
    };

    const unsubMessage = subscribe("chat:message", onMessage);
    const unsubDelivered = subscribe("chat:delivered", onDelivered);
    const unsubSeen = subscribe("chat:seen", onSeen);
    const unsubTyping = subscribe("chat:typing", onTyping);
    const unsubConnected = subscribe("chat:connected", onConnected);
    return () => {
      unsubMessage();
      unsubDelivered();
      unsubSeen();
      unsubTyping();
      unsubConnected();
    };
  }, [subscribe, markThreadRead, openThread]);

  // Deep-link: open thread from the URL once both threads + profiles are ready.
  useEffect(() => {
    if (!urlThreadId || threads.length === 0) return;
    const found = threads.find((t) => t.thread_id === urlThreadId);
    if (found && activeThreadRef.current?.thread_id !== urlThreadId) {
      openThread(found);
    }
  }, [urlThreadId, threads, openThread]);

  // Re-subscribe to context threads for the active conversation object.
  useEffect(() => {
    if (!activeThread || threads.length === 0) return;
    const fresh = threads.find((t) => t.thread_id === activeThread.thread_id);
    if (fresh) {
      activeThreadRef.current = fresh;
      setActiveThread(fresh);
    }
  }, [threads, activeThread]);

  // Auto-scroll on new messages only when already near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    setActiveChat(null);
    return () => setActiveChat(null);
  }, [setActiveChat]);

  useEffect(
    () => () => {
      clearTimeout(typingTimerRef.current);
      setActiveChat(null);
    },
    [setActiveChat]
  );

  // ── Send / typing ─────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const thread = activeThreadRef.current;
    const senderId = myProfileIds.includes(thread.sender_profile_id) ? thread.sender_profile_id : thread.receiver_profile_id;
    const text = newMsg.trim();
    if (!text || !thread || !senderId || sending) return;

    const clientId = crypto.randomUUID();
    const tempMsg = {
      client_id: clientId,
      sender_profile_id: senderId,
      message: text,
      sent_at: new Date().toISOString(),
      _temp: true,
    };
    setSending(true);
    setNewMsg("");
    setTyping(false);
    setMessages((prev) => [...prev, tempMsg]);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

    const { ok, message, error } = await sendMessage({
      profileA: thread.sender_profile_id,
      profileB: thread.receiver_profile_id,
      senderProfileId: senderId,
      text,
    });
    setSending(false);

    if (ok && message) {
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !(m.client_id === clientId && !m.id));
        const known = new Set(withoutTemp.map((m) => m.id));
        return known.has(message.id) ? withoutTemp : [...withoutTemp, message];
      });
    } else {
      setMessages((prev) => prev.map((m) => (m.client_id === clientId ? { ...m, _temp: false, _error: true } : m)));
    }
  };

  const retrySend = async (msg) => {
    const thread = activeThreadRef.current;
    const senderId = myProfileIds.includes(thread.sender_profile_id) ? thread.sender_profile_id : thread.receiver_profile_id;
    if (!thread || !senderId) return;
    setMessages((prev) => prev.map((m) => (m.client_id === msg.client_id ? { ...m, _temp: true, _error: false } : m)));
    const { ok, message } = await sendMessage({
      profileA: thread.sender_profile_id,
      profileB: thread.receiver_profile_id,
      senderProfileId: senderId,
      text: msg.message,
    });
    if (ok && message) {
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !(m.client_id === msg.client_id && !m.id));
        const known = new Set(withoutTemp.map((m) => m.id));
        return known.has(message.id) ? withoutTemp : [...withoutTemp, message];
      });
    } else {
      setMessages((prev) => prev.map((m) => (m.client_id === msg.client_id ? { ...m, _temp: false, _error: true } : m)));
    }
  };

  const setTypingLocal = useCallback(
    (val) => {
      const thread = activeThreadRef.current;
      if (!thread) return;
      setTyping({ profileA: thread.sender_profile_id, profileB: thread.receiver_profile_id, isTyping: val });
    },
    [setTyping]
  );

  const onInputChange = (e) => {
    const val = e.target.value;
    setNewMsg(val);
    if (val && !sending) setTypingLocal(true);
    if (!val) setTypingLocal(false);
  };

  const closeThread = () => {
    setTypingLocal(false);
    activeThreadRef.current = null;
    setActiveThread(null);
    setActiveChat(null);
    if (urlThreadId) navigate("/chat", { replace: true });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = distFromBottom < 150;
    if (el.scrollTop < 60) loadOlder();
  };

  const other = activeThread ? otherSide(activeThread) : null;
  const isOnline = other ? !!onlineUsers[String(other.otherUserId)]?.online : false;
  const otherLastSeen = other ? onlineUsers[String(other.otherUserId)]?.lastSeen : null;

  return (
    <div className="h-[100dvh] flex flex-col">
      <div className="px-5 py-3 flex items-center gap-3 border-b border-[var(--border)] grad-primary shrink-0">
        <button onClick={() => navigate("/dashboard")} className="text-white/80 hover:text-white text-xl font-bold mr-1" aria-label="Back to dashboard">
          ←
        </button>
        <MessagesSquare className="w-6 h-6 text-white" aria-hidden="true" />
        <div className="flex-1">
          <h1 className="text-white font-extrabold text-lg leading-tight">Messages</h1>
          <p className="text-white/70 text-xs">
            {connected ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" /> Reconnecting…
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSound}
          className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label={soundEnabled ? "Mute message sounds" : "Enable message sounds"}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Conversation list */}
        <aside
          className={`shrink-0 border-r border-[var(--border)] bg-[var(--surface-glass)] flex-col overflow-hidden ${activeThread ? "hidden md:flex" : "flex"} w-full md:w-80`}
        >
          <div className="p-4 border-b border-[var(--border)] shrink-0">
            <h2 className="font-bold text-[var(--ink)] text-sm">Your Chats</h2>
            <p className="text-xs text-[var(--ink-faint)] mt-0.5">
              {threads.length} {threads.length === 1 ? "connection" : "connections"}
            </p>
          </div>

          {threads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-5xl mb-3">💌</div>
              <h3 className="font-bold text-[var(--ink)] text-sm mb-1">No chats yet</h3>
              <p className="text-xs text-[var(--ink-faint)] mb-4">Chat unlocks when someone accepts your interest</p>
              <Link to="/search">
                <Button size="sm">Browse Profiles</Button>
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {threads.map((thread) => {
                const side = otherSide(thread);
                const online = !!onlineUsers[String(side.otherUserId)]?.online;
                const active = activeThread?.thread_id === thread.thread_id;
                return (
                  <motion.button
                    key={thread.thread_id}
                    whileHover={{ x: 2 }}
                    onClick={() => openThread(thread)}
                    className={`w-full flex items-center gap-3 p-4 border-b border-[var(--border)] text-left transition-colors ${
                      active ? "bg-[var(--primary-soft)] border-l-4 border-l-[var(--primary)]" : "hover:bg-[var(--primary-soft)]/60"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md grad-primary">
                        {side.otherName?.[0]?.toUpperCase() || "?"}
                      </div>
                      {online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--success)] border-2 border-white" aria-label="Online" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-[var(--ink)] text-sm truncate">{side.otherName}</p>
                        {thread.last_at && <span className="text-[10px] text-[var(--ink-faint)] shrink-0">{formatListDate(thread.last_at)}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {thread.unread_count === 0 && thread.last_message && myProfileIds.includes(thread.last_sender_profile_id) && (
                          <MessageStatus msg={{ delivered_at: true }} />
                        )}
                        <p className={`text-xs truncate mt-0.5 flex-1 ${thread.unread_count > 0 ? "text-[var(--ink)] font-semibold" : "text-[var(--ink-faint)]"}`}>
                          {typingThreads[thread.thread_id] ? (
                            <span className="text-[var(--primary)] font-semibold">{typingThreads[thread.thread_id]} is typing…</span>
                          ) : (
                            thread.last_message || "No messages yet — say hello!"
                          )}
                        </p>
                      </div>
                    </div>
                    {thread.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full grad-primary text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">
                        {thread.unread_count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Chat pane */}
        <main className={`flex-1 flex-col ${!activeThread ? "hidden md:flex" : "flex"} min-w-0`}>
          {!activeThread || !other ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-7xl mb-4">💬</div>
              <h3 className="font-bold text-[var(--ink)] text-lg mb-2">Select a conversation</h3>
              <p className="text-sm text-[var(--ink-faint)]">Choose from your accepted connections on the left</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] bg-[var(--surface-glass)] shrink-0">
                <button onClick={closeThread} className="md:hidden text-[var(--ink-faint)] text-xl" aria-label="Back to conversations">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow grad-primary">
                    {other.otherName?.[0]?.toUpperCase()}
                  </div>
                  {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--success)] border-2 border-white" aria-label="Online" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--ink)] text-sm truncate">{other.otherName}</p>
                  <p className={`text-xs font-semibold ${isOnline ? "text-[var(--success)]" : "text-[var(--ink-faint)]"}`}>
                    {typingName ? <span className="text-[var(--primary)]">typing…</span> : isOnline ? "Online" : otherLastSeen ? formatLastSeen(otherLastSeen) : "Offline"}
                  </p>
                </div>
                <Link to={`/profile/${other.otherProfileId}`}>
                  <Button size="sm" variant="soft">
                    View Profile
                  </Button>
                </Link>
              </div>

              <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-4 flex flex-col gap-1" style={{ minHeight: 0 }}>
                {loadingOlder && (
                  <div className="flex justify-center py-2">
                    <Spinner className="w-4 h-4" label="" />
                  </div>
                )}
                {loadingMsgs ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Spinner label="Loading messages…" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="text-5xl mb-3">👋</div>
                    <p className="font-bold text-[var(--ink)] text-sm mb-1">Start the conversation!</p>
                    <p className="text-xs text-[var(--ink-faint)]">Say hello to {other.otherName}</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                      const mine = isMine(msg);
                      const prevMsg = messages[idx - 1];
                      const showDate = idx === 0 || formatDate(prevMsg?.sent_at) !== formatDate(msg.sent_at);
                      const bubbleColor = mine ? { background: "linear-gradient(135deg,#f43f5e,#ec4899)" } : {};
                      return (
                        <div key={msg.id || msg.client_id || idx}>
                          {showDate && (
                            <div className="flex items-center gap-3 my-3">
                              <div className="flex-1 h-px bg-[var(--border)]" />
                              <span className="text-[10px] text-[var(--ink-faint)] font-semibold px-2">{formatDate(msg.sent_at)}</span>
                              <div className="flex-1 h-px bg-[var(--border)]" />
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[70%] flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                                  mine ? "text-white rounded-br-sm" : "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] rounded-bl-sm"
                                } ${msg._temp && !msg._error ? "opacity-60" : ""} ${msg._error ? "opacity-80" : ""}`}
                                style={mine ? bubbleColor : {}}
                              >
                                {msg.message}
                              </div>
                              <span className="text-[10px] text-[var(--ink-faint)] px-1 inline-flex items-center gap-1">
                                {formatTime(msg.sent_at)} {mine && <MessageStatus msg={msg} />}
                              </span>
                              {msg._error && (
                                <button
                                  type="button"
                                  onClick={() => retrySend(msg)}
                                  className="text-[10px] text-[var(--error)] font-bold underline"
                                >
                                  Not sent — tap to retry
                                </button>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-[var(--border)] bg-[var(--surface-glass)] flex items-center gap-2 shrink-0">
                {myProfiles.length > 1 && (
                  <select
                    value={myProfileId || ""}
                    onChange={(e) => {
                      setMyProfileId(Number(e.target.value));
                      setTypingLocal(false);
                    }}
                    className="input-base text-xs !w-auto px-2 py-2"
                    aria-label="Send as"
                  >
                    {myProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={newMsg}
                  onChange={onInputChange}
                  placeholder="Type a message…"
                  maxLength={2000}
                  className="input-base flex-1 !py-3"
                  style={{ minWidth: 0 }}
                  aria-label="Message"
                />
                <Button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  loading={sending}
                  ariaLabel="Send message"
                  className="!w-11 !h-11 !p-0 !rounded-2xl shrink-0"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </Button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
