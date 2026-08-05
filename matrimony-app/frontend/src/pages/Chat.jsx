import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessagesSquare, Lock, Send, Plus } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Button, Badge, Spinner } from "../components/ui";

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { threadId: urlThreadId } = useParams();

  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myProfiles, setMyProfiles] = useState([]);
  const [myProfileId, setMyProfileId] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const sinceRef = useRef(null);
  const activeThreadRef = useRef(null);

  const loadThreads = useCallback(async () => {
    try {
      const [threadsRes, mineRes] = await Promise.all([
        api.get("/chat/threads"),
        api.get("/profiles/mine"),
      ]);
      const loadedThreads = threadsRes.data.threads || [];
      const profiles = mineRes.data.profiles || [];
      setThreads(loadedThreads);
      setMyProfiles(profiles);
      if (profiles.length > 0) setMyProfileId((prev) => prev || profiles[0].id);
      return { threads: loadedThreads, profiles };
    } catch (err) {
      console.error(err);
      return { threads: [], profiles: [] };
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadThreads().then(({ threads: t, profiles: p }) => {
      if (urlThreadId && t.length > 0) {
        const found = t.find((th) => th.thread_id === urlThreadId);
        if (found) openThreadFn(found, p);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openThreadFn = useCallback((thread, profiles) => {
    clearInterval(pollRef.current);
    setActiveThread(thread);
    activeThreadRef.current = thread;
    setLoadingMsgs(true);
    sinceRef.current = null;

    api.get(`/chat/${thread.sender_profile_id}/${thread.receiver_profile_id}`)
      .then((res) => {
        const msgs = res.data.messages || [];
        setMessages(msgs);
        if (msgs.length > 0) sinceRef.current = msgs[msgs.length - 1].sent_at;
      })
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));

    pollRef.current = setInterval(async () => {
      const cur = activeThreadRef.current;
      if (!cur) return;
      try {
        const since = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : "";
        const res = await api.get(`/chat/${cur.sender_profile_id}/${cur.receiver_profile_id}${since}`);
        if (res.data.messages?.length > 0) {
          setMessages((prev) => [...prev, ...res.data.messages]);
          sinceRef.current = res.data.messages[res.data.messages.length - 1].sent_at;
        }
      } catch (_) {}
    }, 3000);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeThread || !myProfileId || sending) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_profile_id: myProfileId,
      message: newMsg.trim(),
      sent_at: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    const msgText = newMsg.trim();
    setNewMsg("");
    try {
      const res = await api.post(
        `/chat/${activeThread.sender_profile_id}/${activeThread.receiver_profile_id}`,
        { message: msgText, sender_profile_id: myProfileId }
      );
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data.message : m)));
      sinceRef.current = res.data.message.sent_at;
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const getOtherName = (thread) => {
    const myIds = myProfiles.map((p) => p.id);
    return myIds.includes(thread.sender_profile_id) ? thread.receiver_name : thread.sender_name;
  };

  const getOtherProfileId = (thread) => {
    const myIds = myProfiles.map((p) => p.id);
    return myIds.includes(thread.sender_profile_id) ? thread.receiver_profile_id : thread.sender_profile_id;
  };

  const isMine = (msg) => myProfiles.some((p) => p.id === msg.sender_profile_id);

  const formatTime = (t) => {
    if (!t) return "";
    return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (t) => {
    if (!t) return "";
    const d = new Date(t);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-[var(--border)] grad-primary">
        <button onClick={() => navigate("/dashboard")} className="text-white/80 hover:text-white text-xl font-bold mr-1" aria-label="Back to dashboard">←</button>
        <MessagesSquare className="w-6 h-6 text-white" aria-hidden="true" />
        <div>
          <h1 className="text-white font-extrabold text-lg leading-tight">Messages</h1>
          <p className="text-white/70 text-xs">Only after mutual acceptance</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ maxWidth: "1152px", margin: "0 auto", width: "100%" }}>
        {/* Thread sidebar */}
        <div className={`shrink-0 border-r border-[var(--border)] bg-[var(--surface-glass)] flex flex-col ${activeThread ? "hidden md:flex" : "flex"}`} style={{ width: "320px" }}>
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--ink)] text-sm">Your Chats</h2>
            <p className="text-xs text-[var(--ink-faint)] mt-0.5">{threads.length} active {threads.length === 1 ? "connection" : "connections"}</p>
          </div>

          {loadingThreads ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner label="Loading threads…" />
            </div>
          ) : threads.length === 0 ? (
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
              {threads.map((thread) => (
                <motion.button
                  key={thread.thread_id}
                  whileHover={{ x: 2 }}
                  onClick={() => openThreadFn(thread, myProfiles)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-[var(--border)] text-left transition-colors ${
                    activeThread?.thread_id === thread.thread_id ? "bg-[var(--primary-soft)] border-l-4 border-l-[var(--primary)]" : "hover:bg-[var(--primary-soft)]/60"
                  }`}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-lg font-bold text-white shadow-md grad-primary">
                    {getOtherName(thread)?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[var(--ink)] text-sm truncate">{getOtherName(thread)}</p>
                      {thread.last_at && <span className="text-[10px] text-[var(--ink-faint)] shrink-0 ml-1">{formatDate(thread.last_at)}</span>}
                    </div>
                    <p className="text-xs text-[var(--ink-faint)] truncate mt-0.5">{thread.last_message || "No messages yet — say hello! 👋"}</p>
                  </div>
                  {thread.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full grad-primary text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">{thread.unread_count}</span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col ${!activeThread ? "hidden md:flex" : "flex"}`}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-7xl mb-4">💬</div>
              <h3 className="font-bold text-[var(--ink)] text-lg mb-2">Select a conversation</h3>
              <p className="text-sm text-[var(--ink-faint)]">Choose from your accepted connections on the left</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] bg-[var(--surface-glass)]">
                <button onClick={() => { setActiveThread(null); activeThreadRef.current = null; clearInterval(pollRef.current); }} className="md:hidden text-[var(--ink-faint)] text-xl" aria-label="Back to conversations">←</button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow grad-primary">
                  {getOtherName(activeThread)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--ink)] text-sm">{getOtherName(activeThread)}</p>
                  <p className="text-xs text-[var(--success)] font-semibold">● Connected</p>
                </div>
                <Link to={`/profile/${getOtherProfileId(activeThread)}`}>
                  <Button size="sm" variant="soft">View Profile</Button>
                </Link>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" style={{ minHeight: 0 }}>
                {loadingMsgs ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Spinner label="Loading messages…" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="text-5xl mb-3">👋</div>
                    <p className="font-bold text-[var(--ink)] text-sm mb-1">Start the conversation!</p>
                    <p className="text-xs text-[var(--ink-faint)]">Say hello to {getOtherName(activeThread)}</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                      const mine = isMine(msg);
                      const prevMsg = messages[idx - 1];
                      const showDate = idx === 0 || formatDate(prevMsg?.sent_at) !== formatDate(msg.sent_at);
                      return (
                        <div key={msg.id || idx}>
                          {showDate && (
                            <div className="flex items-center gap-3 my-3">
                              <div className="flex-1 h-px bg-[var(--border)]" />
                              <span className="text-[10px] text-[var(--ink-faint)] font-semibold px-2">{formatDate(msg.sent_at)}</span>
                              <div className="flex-1 h-px bg-[var(--border)]" />
                            </div>
                          )}
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${mine ? "text-white rounded-br-sm" : "bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] rounded-bl-sm"} ${msg._temp ? "opacity-60" : ""}`} style={mine ? { background: "linear-gradient(135deg,#f43f5e,#ec4899)" } : {}}>
                                {msg.message}
                              </div>
                              <span className="text-[10px] text-[var(--ink-faint)] px-1">{formatTime(msg.sent_at)} {msg._temp ? "Sending…" : ""}</span>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {activeThread && activeThread.status && activeThread.status !== 'accepted' ? (
                <div className="p-4 border-t border-[var(--border)] bg-[var(--primary-soft)]/80 text-center">
                  <p className="text-xs font-bold text-[var(--primary-strong)] flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>You can start chatting once your interest request is accepted.</span>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-[var(--surface-glass)] flex items-center gap-3">
                  {myProfiles.length > 1 && (
                    <select value={myProfileId || ""} onChange={(e) => setMyProfileId(Number(e.target.value))} className="input-base text-xs !w-auto px-2 py-2">
                      {myProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type a message…"
                    maxLength={2000}
                    className="input-base flex-1 !py-3"
                    style={{ minWidth: 0 }}
                    aria-label="Message"
                  />
                  <Button type="submit" disabled={!newMsg.trim() || sending} loading={sending} ariaLabel="Send message" className="!w-11 !h-11 !p-0 !rounded-2xl shrink-0">
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
