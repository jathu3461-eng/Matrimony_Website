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
  let cls = "text-white/60";
  if (msg._error) {
    return (
      <span className="inline-flex items-center gap-1 text-red-300" title="Not delivered — tap to retry">
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (msg._temp) {
    icon = <Clock className="w-3.5 h-3.5" aria-hidden="true" />;
  } else if (msg.read_at) {
    icon = <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />;
    cls = "text-[#4FC3F7]";
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
  const inputRef = useRef(null);
  const activeThreadRef = useRef(null);
  const myProfileIdRef = useRef(null);
  const messagesRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const typingTimerRef = useRef(null);
  const openKeyRef = useRef(null);
  const nearBottomRef = useRef(true);
  const chatContainerRef = useRef(null);

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

  // ── Mobile keyboard handling via visualViewport ───────────────────────
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const updateViewport = () => {
      if (window.visualViewport) {
        const vp = window.visualViewport;
        container.style.setProperty("--chat-vv-height", `${vp.height}px`);
        container.style.setProperty("--chat-vv-offset", `${vp.offsetTop}px`);
      }
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateViewport);
      vv.addEventListener("scroll", updateViewport);
    }
    window.addEventListener("resize", updateViewport);
    updateViewport();

    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateViewport);
        vv.removeEventListener("scroll", updateViewport);
      }
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

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
      const known = new Set(messagesRef.current.map((m) => m.id));
      if (known.has(msg.id)) return;
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !(m.client_id && m.client_id === msg.client_id && !m.id));
        return [...withoutTemp, msg];
      });
      setTypingName(null);
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
    <div ref={chatContainerRef} className="chat-root">
      {/* ══════ TOP HEADER — Pink gradient ══════ */}
      <header className="chat-top-header">
        <button
          onClick={() => navigate("/dashboard")}
          className="chat-top-back"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="chat-top-icon">
          <MessagesSquare className="w-6 h-6 text-white" />
        </div>
        <div className="chat-top-title">
          <h1>Messages</h1>
          <p>
            {connected ? (
              <span className="chat-status-connected">
                <span className="chat-status-dot-green" />
                Connected
              </span>
            ) : (
              <span className="chat-status-disconnected">
                <span className="chat-status-dot-pulse" />
                Reconnecting…
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSound}
          className="chat-top-sound-btn"
          aria-label={soundEnabled ? "Mute message sounds" : "Enable message sounds"}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="chat-main">
        {/* ── Sidebar: Conversation list ── */}
        <aside
          className={`chat-sidebar ${activeThread ? "chat-sidebar-hidden-mobile" : "chat-sidebar-show-mobile"}`}
        >
          <div className="chat-sidebar-header">
            <h2>Your Chats</h2>
            <p>
              {threads.length} {threads.length === 1 ? "connection" : "connections"}
            </p>
          </div>

          {threads.length === 0 ? (
            <div className="chat-sidebar-empty">
              <div className="text-5xl mb-3">💌</div>
              <h3>No chats yet</h3>
              <p>Chat unlocks when someone accepts your interest</p>
              <Link to="/search">
                <Button size="sm">Browse Profiles</Button>
              </Link>
            </div>
          ) : (
            <div className="chat-sidebar-list">
              {threads.map((thread) => {
                const side = otherSide(thread);
                const online = !!onlineUsers[String(side.otherUserId)]?.online;
                const active = activeThread?.thread_id === thread.thread_id;
                return (
                  <motion.button
                    key={thread.thread_id}
                    whileHover={{ x: 2 }}
                    onClick={() => openThread(thread)}
                    className={`chat-thread-item ${active ? "chat-thread-item-active" : ""}`}
                  >
                    <div className="chat-thread-avatar-wrap">
                      <div className="chat-thread-avatar">
                        {side.otherName?.[0]?.toUpperCase() || "?"}
                      </div>
                      {online && <span className="chat-thread-online-dot" aria-label="Online" />}
                    </div>
                    <div className="chat-thread-info">
                      <div className="chat-thread-info-top">
                        <p className="chat-thread-name">{side.otherName}</p>
                        {thread.last_at && <span className="chat-thread-date">{formatListDate(thread.last_at)}</span>}
                      </div>
                      <div className="chat-thread-info-bottom">
                        {thread.unread_count === 0 && thread.last_message && myProfileIds.includes(thread.last_sender_profile_id) && (
                          <span className="chat-thread-tick-sent">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <p className={`chat-thread-preview ${thread.unread_count > 0 ? "chat-thread-preview-unread" : ""}`}>
                          {typingThreads[thread.thread_id] ? (
                            <span className="chat-thread-typing">{typingThreads[thread.thread_id]} is typing…</span>
                          ) : (
                            thread.last_message || "No messages yet — say hello!"
                          )}
                        </p>
                      </div>
                    </div>
                    {thread.unread_count > 0 && (
                      <span className="chat-thread-unread-badge">
                        {thread.unread_count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </aside>

        {/* ── Chat pane ── */}
        <main className={`chat-pane ${!activeThread ? "chat-pane-hidden-mobile" : "chat-pane-show-mobile"}`}>
          {!activeThread || !other ? (
            <div className="chat-empty-state">
              <div className="text-7xl mb-4">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose from your accepted connections on the left</p>
            </div>
          ) : (
            <>
              {/* ── Conversation header ── */}
              <div className="chat-conv-header">
                <button onClick={closeThread} className="chat-conv-back-mobile" aria-label="Back to conversations">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="chat-conv-avatar-wrap">
                  <div className="chat-conv-avatar">
                    {other.otherName?.[0]?.toUpperCase()}
                  </div>
                  {isOnline && <span className="chat-conv-online-dot" aria-label="Online" />}
                </div>
                <div className="chat-conv-info">
                  <p className="chat-conv-name">{other.otherName}</p>
                  <p className={`chat-conv-status ${isOnline ? "chat-conv-status-online" : ""}`}>
                    {typingName ? (
                      <span className="chat-conv-typing">typing…</span>
                    ) : isOnline ? (
                      "Online"
                    ) : otherLastSeen ? (
                      formatLastSeen(otherLastSeen)
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
                <Link to={`/profile/${other.otherProfileId}`} className="chat-conv-view-profile">
                  View Profile
                </Link>
              </div>

              {/* ── Messages area ── */}
              <div ref={scrollRef} onScroll={onScroll} className="chat-messages-area">
                {loadingOlder && (
                  <div className="chat-loading-older">
                    <Spinner className="w-4 h-4" label="" />
                  </div>
                )}
                {loadingMsgs ? (
                  <div className="chat-loading-initial">
                    <Spinner label="Loading messages…" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-conversation">
                    <div className="text-5xl mb-3">👋</div>
                    <p>Start the conversation!</p>
                    <p>Say hello to {other.otherName}</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                      const mine = isMine(msg);
                      const prevMsg = messages[idx - 1];
                      const showDate = idx === 0 || formatDate(prevMsg?.sent_at) !== formatDate(msg.sent_at);
                      return (
                        <div key={msg.id || msg.client_id || idx}>
                          {showDate && (
                            <div className="chat-date-separator">
                              <span>{formatDate(msg.sent_at)}</span>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`chat-bubble-row ${mine ? "chat-bubble-row-out" : "chat-bubble-row-in"}`}
                          >
                            <div className={`chat-bubble-col ${mine ? "chat-bubble-col-out" : "chat-bubble-col-in"}`}>
                              <div
                                className={`chat-bubble ${mine ? "chat-bubble-out" : "chat-bubble-in"} ${
                                  msg._temp && !msg._error ? "opacity-60" : ""
                                } ${msg._error ? "opacity-80" : ""}`}
                              >
                                {msg.message}
                              </div>
                              <span className={`chat-bubble-time ${mine ? "chat-bubble-time-out" : "chat-bubble-time-in"}`}>
                                {formatTime(msg.sent_at)}
                                {mine && <MessageStatus msg={msg} />}
                              </span>
                              {msg._error && (
                                <button
                                  type="button"
                                  onClick={() => retrySend(msg)}
                                  className="chat-retry-btn"
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

              {/* ── Message composer ── */}
              <form onSubmit={handleSend} className="chat-composer">
                {myProfiles.length > 1 && (
                  <select
                    value={myProfileId || ""}
                    onChange={(e) => {
                      setMyProfileId(Number(e.target.value));
                      setTypingLocal(false);
                    }}
                    className="chat-composer-profile-select"
                    aria-label="Send as"
                  >
                    {myProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="chat-composer-input-wrap">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMsg}
                    onChange={onInputChange}
                    placeholder="Type a message…"
                    maxLength={2000}
                    className="chat-composer-input"
                    aria-label="Message"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMsg.trim() || sending}
                  className="chat-composer-send"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Spinner className="w-5 h-5 text-white" label="" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
