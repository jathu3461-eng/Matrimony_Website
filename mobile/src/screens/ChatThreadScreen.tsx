import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatApi } from '@/api/chat';
import { profileApi } from '@/api/profiles';
import { uploadsUrl } from '@/api/client';
import { Spinner } from '@/components/Spinner';
import { useAppSelector } from '@/store/hooks';
import { useSocket } from '@/context/SocketContext';
import { getSocket, sendChatMessage } from '@/services/chatSocket';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { ChatMessage } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type ChatRoute = RouteProp<RootStackParamList, 'ChatThread'>;
type ChatNav = NativeStackNavigationProp<RootStackParamList>;

function formatChatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatLastSeen(ts: string | null): string {
  if (!ts) return 'Offline';
  const d = new Date(ts);
  const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (diff < 1) return 'last seen just now';
  if (diff < 60) return `last seen ${diff} min ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `last seen ${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `last seen ${days} d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface DisplayItem {
  type: 'date' | 'message';
  date?: string;
  message?: ChatMessage;
  isMe?: boolean;
}

const PINK = '#e0136a';
const PINK_LIGHT = '#ff5f9e';
const PINK_BG = '#fff5f9';
const PINK_BORDER = '#f3dbe7';
const PINK_SOFT = '#ffe4ee';

export function ChatThreadScreen() {
  const route = useRoute<ChatRoute>();
  const navigation = useNavigation<ChatNav>();
  const { profileA, profileB, otherName } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const { connected, isOnline, getPresence, subscribe, seedPresence } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputHeight, setInputHeight] = useState(44);
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingSentAtRef = useRef(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);
  const loadOlderReqIdRef = useRef(0);

  const [myProfiles, setMyProfiles] = useState<number[]>([]);
  const [otherUserId, setOtherUserId] = useState<number | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(otherName || null);
  useEffect(() => {
    profileApi.mine().then((profiles) => {
      const myIds = new Set(profiles.map((p) => Number(p.id)));
      setMyProfiles([...myIds]);
      // Determine which profile is the "other" one
      const aId = Number(profileA);
      const bId = Number(profileB);
      const otherId = myIds.has(aId) ? bId : aId;
      if (otherId) {
        profileApi.getById(otherId).then((p) => {
          setOtherUserId(Number(p.owner_user_id));
          // Always show the other profile's real name (never the app name).
          if ((p as any)?.name) {
            setResolvedName((p as any).name);
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [profileA, profileB, otherName]);

  // Instant online state via REST the moment we know who we're talking to;
  // socket events keep it live afterwards.
  useEffect(() => {
    if (otherUserId == null) return;
    let active = true;
    chatApi.presence()
      .then((map) => {
        if (!active) return;
        const info = map[String(otherUserId)] ?? map[Number(otherUserId)];
        if (info) seedPresence({ [otherUserId]: info });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [otherUserId, seedPresence]);

  const senderProfileId = myProfiles.includes(Number(profileA))
    ? profileA
    : myProfiles.includes(Number(profileB))
      ? profileB
      : profileA;

  const otherProfileId = Number(senderProfileId) === Number(profileA) ? profileB : profileA;

  const PAGE_SIZE = 60;

  // Load the newest page first (newest messages at the bottom, WhatsApp-style).
  const loadMessages = async () => {
    try {
      const data = await chatApi.history(profileA, profileB, {
        limit: PAGE_SIZE,
        before: Number.MAX_SAFE_INTEGER,
      });
      setMessages(data);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the next older page and prepend it (scroll position is preserved via
  // FlatList's maintainVisibleContentPosition). No duplicates ever added.
  const loadOlder = async () => {
    if (loadingOlderRef.current || !hasMore) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    const reqId = ++loadOlderReqIdRef.current;
    const firstId = messages[0]?.id;
    if (firstId == null) {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
      return;
    }
    try {
      const older = await chatApi.history(profileA, profileB, {
        limit: PAGE_SIZE,
        before: firstId,
      });
      if (reqId !== loadOlderReqIdRef.current) return;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => Number(m.id)));
        const fresh = older.filter((m) => !known.has(Number(m.id)));
        return [...fresh, ...prev];
      });
      setHasMore(older.length >= PAGE_SIZE);
    } catch {
    } finally {
      if (reqId === loadOlderReqIdRef.current) {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      }
    }
  };

  // Real-time comes from the socket; only poll when it's disconnected so the
  // optimistic bubbles and live ticks are never wiped by a stale history reload.
  useEffect(() => {
    loadMessages();
    const tick = () => {
      const s = getSocket();
      if (!s || !s.connected) loadMessages();
    };
    pollRef.current = setInterval(tick, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [profileA, profileB]);

  // Resync the full history whenever the socket reconnects (e.g. returning from
  // background or recovering from a network drop) so missed messages show up
  // immediately without requiring a manual refresh.
  const prevConnectedRef = useRef(connected);
  useEffect(() => {
    if (connected && !prevConnectedRef.current) {
      loadMessages();
    }
    prevConnectedRef.current = connected;
  }, [connected]);

  // Mark the conversation as read while it's open (WhatsApp-style blue ticks)
  useEffect(() => {
    if (loading) return;
    const s = getSocket();
    if (!s) return;
    const markRead = () => {
      if (s.connected) {
        s.emit('chat:read', { profileA: Number(profileA), profileB: Number(profileB) }, () => {});
      }
    };
    markRead();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') markRead();
    });
    return () => sub.remove();
  }, [profileA, profileB, loading, messages.length]);

  // Real-time delivery, seen receipts & typing indicator over the socket
  useEffect(() => {
    const pa = Number(profileA);
    const pb = Number(profileB);
    const myPair = `${Math.min(pa, pb)}-${Math.max(pa, pb)}`;

    const offMessage = subscribe('chat:message', (m: any) => {
      if (!m) return;
      const pair = [Number(m.sender_profile_id), Number(m.receiver_profile_id)]
        .sort((a, b) => a - b)
        .join('-');
      if (pair !== myPair) return;
      setMessages((prev) => {
        // Reconcile an optimistic bubble that shares this message's client_id.
        const cid = m?.client_id ? String(m.client_id) : null;
        if (cid) {
          const hasOpt = prev.some((x) => String((x as any).client_id) === cid && (x as any)._local);
          if (hasOpt) {
            const rest = prev.filter((x) => !(String((x as any).client_id) === cid));
            return rest.some((x) => Number(x.id) === Number(m.id))
              ? rest
              : [...rest, m as ChatMessage];
          }
        }
        return prev.some((x) => Number(x.id) === Number(m.id))
          ? prev
          : [...prev, m as ChatMessage];
      });
    });

    const offSeen = subscribe('chat:seen', (payload: any) => {
      const ids: number[] = Array.isArray(payload?.messageIds)
        ? payload.messageIds.map(Number)
        : [];
      if (ids.length === 0) return;
      setMessages((prev) =>
        prev.map((msg) =>
          ids.includes(Number(msg.id)) && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg,
        ),
      );
    });

    let typingTimer: ReturnType<typeof setTimeout> | null = null;
    const offTyping = subscribe('chat:typing', (payload: any) => {
      if (otherUserId == null || Number(payload?.userId) !== Number(otherUserId)) return;
      setOtherTyping(!!payload?.isTyping);
      if (typingTimer) clearTimeout(typingTimer);
      if (payload?.isTyping) {
        typingTimer = setTimeout(() => setOtherTyping(false), 3500);
      }
    });

    return () => {
      offMessage();
      offSeen();
      offTyping();
      if (typingTimer) clearTimeout(typingTimer);
    };
  }, [profileA, profileB, otherUserId, subscribe]);

  const nearBottomRef = useRef(true);

  const scrollToBottom = (opts: any = {}) => {
    if (!opts?.force && !nearBottomRef.current) return;
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const onListScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    nearBottomRef.current = distanceFromBottom < 120;
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // After the initial history load, position at the latest message.
  useEffect(() => {
    if (!loading && messages.length > 0) {
      nearBottomRef.current = true;
      scrollToBottom({ force: true });
    }
  }, [loading]);

  useEffect(() => {
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => scrollToBottom(),
    );
    return () => sub.remove();
  }, []);

  const stopTypingSignal = () => {
    const s = getSocket();
    if (s?.connected && typingSentAtRef.current > 0) {
      typingSentAtRef.current = 0;
      s.emit('chat:typing', { profileA: Number(profileA), profileB: Number(profileB), isTyping: false }, () => {});
    }
  };

  const onTextChange = (value: string) => {
    setText(value);
    const s = getSocket();
    if (!s?.connected) return;
    if (!value.trim()) {
      stopTypingSignal();
      return;
    }
    const now = Date.now();
    if (now - typingSentAtRef.current > 2000) {
      typingSentAtRef.current = now;
      s.emit('chat:typing', { profileA: Number(profileA), profileB: Number(profileB), isTyping: true }, () => {});
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    setInputHeight(44);
    stopTypingSignal();
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Optimistic placeholder so the bubble appears instantly (WhatsApp-style).
    const temp: any = {
      id: 0,
      thread_id: `${Math.min(Number(profileA), Number(profileB))}-${Math.max(Number(profileA), Number(profileB))}`,
      sender_profile_id: Number(senderProfileId),
      receiver_profile_id: Number(otherProfileId),
      message: trimmed,
      client_id: clientId,
      sent_at: new Date().toISOString(),
      _local: 'sending',
    };
    setMessages((prev) => [...prev, temp as ChatMessage]);
    scrollToBottom({ force: true });

    const res = await sendChatMessage({
      profileA,
      profileB,
      senderProfileId,
      text: trimmed,
      clientId,
    });

    if (res.ok && res.message) {
      // Reconcile the optimistic bubble with the confirmed server message.
      setMessages((prev) => {
        const next = prev.filter((m) => !(String((m as any).client_id) === clientId));
        return next.some((x) => Number(x.id) === Number(res.message!.id))
          ? next
          : [...next, res.message as ChatMessage];
      });
      scrollToBottom({ force: true });
    } else {
      // Failed to send — restore the text and mark the optimistic bubble failed.
      setText((prev) => prev || trimmed);
      setMessages((prev) =>
        prev.map((m) =>
          String((m as any).client_id) === clientId ? { ...m, _local: 'failed' as any } : m,
        ),
      );
    }
    setSending(false);
  };

  const deleteMessage = async (msg: ChatMessage) => {
    setSelectedMsg(null);
    Alert.alert('Delete message', 'Remove this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatApi.deleteMessage(msg.id);
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          } catch {
            Alert.alert('Error', 'Could not delete message.');
          }
        },
      },
    ]);
  };

  const displayItems: DisplayItem[] = [];
  let lastDateKey = '';
  messages.forEach((msg, i) => {
    const dateKey = getDateKey(msg.sent_at);
    if (dateKey !== lastDateKey) {
      displayItems.push({ type: 'date', date: msg.sent_at });
      lastDateKey = dateKey;
    }
    const isMe = Number(msg.sender_profile_id) === Number(senderProfileId);
    displayItems.push({ type: 'message', message: msg, isMe });
  });

  const otherOnline = otherUserId ? isOnline(otherUserId) : false;
  const otherPresence = otherUserId ? getPresence(otherUserId) : null;

  const displayName = resolvedName || otherName || '?';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  if (loading) return <View style={[styles.loadingWrap, { backgroundColor: PINK_BG }]}><Spinner /></View>;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      {/* ── Conversation Header ── */}
      <View style={[styles.convHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.convBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.convAvatarWrap}>
          <View style={styles.convAvatar}>
            <Text style={styles.convAvatarText}>{initial}</Text>
          </View>
          {otherOnline && <View style={styles.convOnlineDot} />}
        </View>
        <View style={styles.convInfo}>
          <Text style={styles.convName} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.convStatus, { color: otherTyping || otherOnline ? '#22c55e' : '#b08da6' }]}>
            {otherTyping
              ? 'typing…'
              : otherOnline
                ? 'Online'
                : formatLastSeen(otherPresence?.lastSeen ?? null)}
          </Text>
        </View>
        <Pressable
          style={styles.viewProfileBtn}
          onPress={() => navigation.navigate('ProfileDetail', { profileId: otherProfileId })}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </Pressable>
      </View>

      {/* ── Messages Area ── */}
      <FlatList
        ref={flatListRef}
        data={displayItems}
        keyExtractor={(item, i) => item.type === 'date' ? `date-${item.date}` : String((item.message as any).client_id || item.message!.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 200 }}
        onStartReached={loadOlder}
        onStartReachedThreshold={0.3}
        onScroll={onListScroll}
        scrollEventThrottle={32}
        ListFooterComponent={
          loadingOlder ? <Spinner /> : null
        }
        style={styles.messagesArea}
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View style={styles.dateSep}>
                <View style={styles.dateSepLine} />
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{formatChatDate(item.date!)}</Text>
                </View>
                <View style={styles.dateSepLine} />
              </View>
            );
          }
          const msg = item.message!;
          const isMe = item.isMe!;
          const imageUrl = (msg as any).image_url ? uploadsUrl((msg as any).image_url) : null;

          const tickIcon = () => {
            if (!isMe) return null;
            if ((msg as any)._local === 'sending') {
              return <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" />;
            }
            if ((msg as any)._local === 'failed') {
              return <Ionicons name="alert-circle" size={14} color="rgba(255,200,150,0.9)" />;
            }
            if (msg.read_at) {
              return <Ionicons name="checkmark-done" size={16} color="#4FC3F7" />;
            }
            if ((msg as any).delivered || (msg as any).delivered_at) {
              return <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.85)" />;
            }
            return <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.6)" />;
          };

          return (
            <Pressable
              onLongPress={() => setSelectedMsg(msg)}
              style={[styles.bubbleRow, isMe ? styles.bubbleRowOut : styles.bubbleRowIn]}
            >
              <View style={[styles.bubble, isMe ? styles.bubbleOut : styles.bubbleIn]}>
                {imageUrl && (
                  <Image source={{ uri: imageUrl }} style={styles.chatImage} resizeMode="cover" />
                )}
                {msg.message ? (
                  <Text style={[styles.bubbleText, { color: isMe ? '#fff' : colors.ink }]}>
                    {msg.message}
                  </Text>
                ) : null}
                <View style={styles.bubbleMeta}>
                  <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.7)' : '#8a8279' }]}>
                    {formatBubbleTime(msg.sent_at)}
                  </Text>
                  {tickIcon()}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="lock-closed" size={20} color="#8a8279" />
            </View>
            <Text style={styles.emptyText}>
              Messages are end-to-end encrypted.{'\n'}No one outside of this chat can read them.
            </Text>
          </View>
        }
      />

      {/* ── Context Menu Overlay ── */}
      {selectedMsg && (
        <View style={styles.contextOverlay}>
          <Pressable style={styles.contextBackdrop} onPress={() => setSelectedMsg(null)} />
          <View style={[styles.contextMenu, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.contextTitle} numberOfLines={2}>{selectedMsg.message}</Text>
            <View style={styles.contextDivider} />
            {Number(selectedMsg.sender_profile_id) === Number(senderProfileId) && (
              <Pressable style={styles.contextOption} onPress={() => deleteMessage(selectedMsg)}>
                <Ionicons name="trash" size={20} color={colors.error} />
                <Text style={[styles.contextOptionText, { color: colors.error }]}>Delete Message</Text>
              </Pressable>
            )}
            <Pressable style={styles.contextOption} onPress={() => setSelectedMsg(null)}>
              <Ionicons name="close" size={20} color={colors.inkSoft} />
              <Text style={[styles.contextOptionText, { color: colors.inkSoft }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Composer ── */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.composerInputWrap}>
          <TextInput
            style={styles.composerInput}
            placeholder="Message"
            placeholderTextColor="#9e9690"
            value={text}
            onChangeText={onTextChange}
            multiline
            maxLength={2000}
            onContentSizeChange={(e) => {
              const h = Math.min(e.nativeEvent.contentSize.height, 100);
              setInputHeight(Math.max(44, h));
            }}
            onFocus={scrollToBottom}
          />
        </View>
        <Pressable
          onPress={sendMessage}
          disabled={sending || !text.trim()}
          style={({ pressed }) => [
            styles.sendBtn,
            { opacity: sending || !text.trim() ? 0.4 : 1 },
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
        >
          {sending ? (
            <Spinner />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8f5f0',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Conversation Header ──
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e1dc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  convBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f0ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarWrap: {
    position: 'relative',
  },
  convAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  convOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  convInfo: {
    flex: 1,
    minWidth: 0,
  },
  convName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1917',
  },
  convStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  viewProfileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: PINK,
  },
  viewProfileText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Messages Area ──
  messagesArea: {
    flex: 1,
    backgroundColor: '#f8f5f0',
  },
  list: {
    padding: 14,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },

  // ── Date Separator ──
  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dateSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e1dc',
  },
  datePill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#eae6e1',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8a8279',
  },

  // ── Bubbles ──
  bubbleRow: {
    marginBottom: 3,
  },
  bubbleRowOut: {
    alignItems: 'flex-end',
  },
  bubbleRowIn: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleOut: {
    backgroundColor: PINK,
    borderBottomRightRadius: 4,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleIn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e1dc',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 3,
  },
  bubbleTime: {
    fontSize: 11,
  },
  chatImage: {
    width: 220,
    height: 260,
    borderRadius: 12,
    marginBottom: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
    alignSelf: 'center',
    maxWidth: 280,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f0ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8a8279',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Context Menu ──
  contextOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  contextBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  contextMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  contextTitle: {
    fontSize: 14,
    color: '#1c1917',
    marginBottom: 10,
  },
  contextDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e1dc',
    marginBottom: 10,
  },
  contextOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  contextOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Composer ──
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e1dc',
  },
  composerInputWrap: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  composerInput: {
    borderWidth: 1,
    borderColor: '#e5e1dc',
    borderRadius: 20,
    backgroundColor: '#f5f2ee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1c1917',
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
