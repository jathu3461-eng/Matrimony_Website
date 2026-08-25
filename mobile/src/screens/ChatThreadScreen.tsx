import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '@/api/chat';
import { profileApi } from '@/api/profiles';
import { uploadsUrl } from '@/api/client';
import { Spinner } from '@/components/Spinner';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { ChatMessage } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type ChatRoute = RouteProp<RootStackParamList, 'ChatThread'>;

const APP_NAME_RE = /mukurtham\s*matrimony/i;
function sanitizeName(name?: string | null): string {
  if (!name || !name.trim()) return 'Member';
  if (APP_NAME_RE.test(name.trim())) return 'Member';
  return name.trim();
}

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
  const navigation = useNavigation();
  const { profileA, profileB, otherName: rawOtherName } = route.params;
  const otherName = sanitizeName(rawOtherName);
  const { colors } = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputHeight, setInputHeight] = useState(44);
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [myProfiles, setMyProfiles] = useState<number[]>([]);
  useEffect(() => {
    profileApi.mine().then((profiles) => {
      setMyProfiles(profiles.map((p) => Number(p.id)));
    }).catch(() => {});
  }, []);

  const senderProfileId = myProfiles.includes(Number(profileA))
    ? profileA
    : myProfiles.includes(Number(profileB))
      ? profileB
      : profileA;

  const loadMessages = async () => {
    try {
      const data = await chatApi.history(profileA, profileB);
      setMessages(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [profileA, profileB]);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => scrollToBottom(),
    );
    return () => sub.remove();
  }, []);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    setInputHeight(44);
    try {
      const msg = await chatApi.send(profileA, profileB, trimmed, senderProfileId);
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (res.canceled || !res.assets[0]) return;
    setSending(true);
    try {
      const msg = await chatApi.sendImage(profileA, profileB, res.assets[0].uri, senderProfileId);
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    } catch {
      Alert.alert('Error', 'Failed to send image.');
    } finally {
      setSending(false);
    }
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

  const initial = (otherName ?? '?')[0]?.toUpperCase() ?? '?';

  if (loading) return <View style={[styles.loadingWrap, { backgroundColor: PINK_BG }]}><Spinner /></View>;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
    >
      {/* ── Top Header — Pink gradient ── */}
      <View style={styles.topHeader}>
        <Pressable style={styles.topBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topIconWrap}>
          <Ionicons name="chatbubbles" size={22} color="#fff" />
        </View>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Messages</Text>
          <View style={styles.topStatusRow}>
            <View style={styles.connectedDot} />
            <Text style={styles.topStatusText}>Connected</Text>
          </View>
        </View>
        <Pressable style={styles.topSoundBtn}>
          <Ionicons name="volume-high" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* ── Conversation Header — White ── */}
      <View style={styles.convHeader}>
        <Pressable style={styles.convBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.convAvatarWrap}>
          <View style={styles.convAvatar}>
            <Text style={styles.convAvatarText}>{initial}</Text>
          </View>
          <View style={styles.convOnlineDot} />
        </View>
        <View style={styles.convInfo}>
          <Text style={styles.convName} numberOfLines={1}>{otherName}</Text>
          <Text style={styles.convStatus}>Online</Text>
        </View>
        <Pressable style={styles.viewProfileBtn}>
          <Text style={styles.viewProfileText}>View Profile</Text>
        </Pressable>
      </View>

      {/* ── Messages Area ── */}
      <FlatList
        ref={flatListRef}
        data={displayItems}
        keyExtractor={(item, i) => item.type === 'date' ? `date-${item.date}` : String(item.message!.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
            if (msg.read_at) {
              return <Ionicons name="checkmark-done" size={16} color="#4FC3F7" />;
            }
            return <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.6)" />;
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
                  <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.7)' : '#b08da6' }]}>
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
              <Ionicons name="lock-closed" size={20} color={PINK} />
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
          <View style={styles.contextMenu}>
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
      <View style={styles.composer}>
        <View style={styles.composerInputWrap}>
          <TextInput
            style={styles.composerInput}
            placeholder="Type a message..."
            placeholderTextColor="#b08da6"
            value={text}
            onChangeText={setText}
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
          disabled={!text.trim() || sending}
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
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
    backgroundColor: PINK_BG,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Top Header ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: PINK,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  topBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleWrap: {
    flex: 1,
  },
  topTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  topStatusText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  topSoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Conversation Header ──
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PINK_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  convBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PINK_SOFT,
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
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
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
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: PINK_SOFT,
    borderWidth: 1,
    borderColor: PINK_BORDER,
  },
  viewProfileText: {
    color: PINK,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Messages Area ──
  messagesArea: {
    flex: 1,
    backgroundColor: PINK_BG,
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
    backgroundColor: PINK_BORDER,
  },
  datePill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#fce8f1',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b08da6',
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
    borderColor: PINK_BORDER,
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
    backgroundColor: PINK_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#b08da6',
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  contextTitle: {
    fontSize: 14,
    color: '#1c1917',
    marginBottom: 10,
  },
  contextDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PINK_BORDER,
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
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PINK_BORDER,
  },
  composerInputWrap: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  composerInput: {
    borderWidth: 1.5,
    borderColor: PINK_BORDER,
    borderRadius: 999,
    backgroundColor: PINK_BG,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1c1917',
    maxHeight: 100,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
});
