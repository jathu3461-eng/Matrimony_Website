import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(150deg,#fff5f8 0%,#fdf0ff 50%,#f0f4ff 100%)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-pink-100" style={{ background: "linear-gradient(90deg,#f43f5e,#ec4899,#a855f7)" }}>
        <button onClick={() => navigate("/dashboard")} className="text-white/80 hover:text-white text-xl font-bold mr-1">←</button>
        <span className="text-2xl">💬</span>
        <div>
          <h1 className="text-white font-extrabold text-lg leading-tight">Messages</h1>
          <p className="text-white/70 text-xs">Only after mutual acceptance</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ maxWidth: "1152px", margin: "0 auto", width: "100%" }}>
        {/* Thread sidebar */}
        <div className={`shrink-0 border-r border-pink-100 bg-white/80 flex flex-col ${activeThread ? "hidden md:flex" : "flex"}`} style={{ width: "320px" }}>
          <div className="p-4 border-b border-pink-100">
            <h2 className="font-bold text-slate-700 text-sm">Your Chats</h2>
            <p className="text-xs text-slate-400 mt-0.5">{threads.length} active {threads.length === 1 ? "connection" : "connections"}</p>
          </div>

          {loadingThreads ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full" />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-5xl mb-3">💌</div>
              <h3 className="font-bold text-slate-700 text-sm mb-1">No chats yet</h3>
              <p className="text-xs text-slate-400 mb-4">Chat unlocks when someone accepts your interest</p>
              <Link to="/search" className="text-xs px-4 py-2 rounded-xl font-bold text-white shadow" style={{ background: "linear-gradient(90deg,#f43f5e,#ec4899)" }}>Browse Profiles</Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {threads.map((thread) => (
                <motion.button
                  key={thread.thread_id}
                  whileHover={{ x: 2 }}
                  onClick={() => openThreadFn(thread, myProfiles)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-pink-50 text-left transition-colors ${
                    activeThread?.thread_id === thread.thread_id ? "bg-pink-50 border-l-4 border-l-pink-500" : "hover:bg-pink-50/50"
                  }`}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-lg font-bold text-white shadow-md" style={{ background: "linear-gradient(135deg,#f43f5e,#a855f7)" }}>
                    {getOtherName(thread)?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800 text-sm truncate">{getOtherName(thread)}</p>
                      {thread.last_at && <span className="text-[10px] text-slate-400 shrink-0 ml-1">{formatDate(thread.last_at)}</span>}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{thread.last_message || "No messages yet — say hello! 👋"}</p>
                  </div>
                  {thread.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">{thread.unread_count}</span>
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
              <h3 className="font-bold text-slate-700 text-lg mb-2">Select a conversation</h3>
              <p className="text-sm text-slate-400">Choose from your accepted connections on the left</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-pink-100 bg-white/90">
                <button onClick={() => { setActiveThread(null); activeThreadRef.current = null; clearInterval(pollRef.current); }} className="md:hidden text-slate-500 text-xl">←</button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow" style={{ background: "linear-gradient(135deg,#f43f5e,#a855f7)" }}>
                  {getOtherName(activeThread)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{getOtherName(activeThread)}</p>
                  <p className="text-xs text-green-500 font-semibold">● Connected</p>
                </div>
                <Link to={`/profile/${getOtherProfileId(activeThread)}`} className="text-xs px-3 py-1.5 rounded-lg border border-pink-200 text-pink-600 font-bold hover:bg-pink-50 transition-all">View Profile</Link>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" style={{ minHeight: 0 }}>
                {loadingMsgs ? (
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="text-5xl mb-3">👋</div>
                    <p className="font-bold text-slate-700 text-sm mb-1">Start the conversation!</p>
                    <p className="text-xs text-slate-400">Say hello to {getOtherName(activeThread)}</p>
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
                              <div className="flex-1 h-px bg-pink-100" />
                              <span className="text-[10px] text-slate-400 font-semibold px-2">{formatDate(msg.sent_at)}</span>
                              <div className="flex-1 h-px bg-pink-100" />
                            </div>
                          )}
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${mine ? "text-white rounded-br-sm" : "bg-white text-slate-800 border border-pink-100 rounded-bl-sm"} ${msg._temp ? "opacity-60" : ""}`} style={mine ? { background: "linear-gradient(135deg,#f43f5e,#ec4899)" } : {}}>
                                {msg.message}
                              </div>
                              <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.sent_at)} {msg._temp ? "Sending…" : ""}</span>
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
                <div className="p-4 border-t border-amber-200 bg-amber-50/90 text-center">
                  <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                    <span>🔒</span>
                    <span>You can start chatting once your interest request is accepted.</span>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="p-4 border-t border-pink-100 bg-white/90 flex items-center gap-3">
                  {myProfiles.length > 1 && (
                    <select value={myProfileId || ""} onChange={(e) => setMyProfileId(Number(e.target.value))} className="text-xs border border-pink-200 rounded-xl px-2 py-2 text-slate-700 focus:outline-none focus:border-pink-400">
                      {myProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type a message…"
                    maxLength={2000}
                    className="flex-1 px-4 py-3 rounded-2xl border border-pink-200 bg-pink-50/50 text-sm focus:outline-none focus:border-pink-400 focus:bg-white transition-all"
                    style={{ minWidth: 0 }}
                  />
                  <motion.button type="submit" disabled={!newMsg.trim() || sending} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md disabled:opacity-50 shrink-0" style={{ background: "linear-gradient(135deg,#f43f5e,#ec4899)" }}>
                    {sending ? "…" : "➤"}
                  </motion.button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
