import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
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
  showTail?: boolean;
}

export function ChatThreadScreen() {
  const route = useRoute<ChatRoute>();
  const { profileA, profileB } = route.params;
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
    const nextMsg = messages[i + 1];
    const showTail = !nextMsg || Number(nextMsg.sender_profile_id) !== Number(msg.sender_profile_id);
    displayItems.push({ type: 'message', message: msg, isMe, showTail });
  });

  if (loading) return <Spinner />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={displayItems}
        keyExtractor={(item, i) => item.type === 'date' ? `date-${item.date}` : String(item.message!.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View style={styles.dateSep}>
                <View style={[styles.datePill, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.dateText, { color: colors.primaryDark }]}>{formatChatDate(item.date!)}</Text>
                </View>
              </View>
            );
          }
          const msg = item.message!;
          const isMe = item.isMe!;
          const imageUrl = (msg as any).image_url ? uploadsUrl((msg as any).image_url) : null;

          const tickIcon = () => {
            if (!isMe) return null;
            if (msg.read_at) {
              return <Ionicons name="checkmark-done" size={16} color="#53BDEB" />;
            }
            return <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.5)" />;
          };

          return (
            <Pressable
              onLongPress={() => setSelectedMsg(msg)}
              style={[
                styles.bubble,
                item.showTail ? styles.bubbleTail : styles.bubbleNoTail,
                isMe
                  ? [styles.bubbleMe, { backgroundColor: '#005C4B' }]
                  : [styles.bubbleOther, { backgroundColor: colors.surface }],
              ]}
            >
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.chatImage} resizeMode="cover" />
              )}
              {msg.message ? (
                <View style={styles.bubbleContent}>
                  <Text style={[styles.bubbleText, { color: isMe ? '#E9EDEF' : colors.ink }]}>
                    {msg.message}
                  </Text>
                  <View style={styles.bubbleMeta}>
                    <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.inkFaint }]}>
                      {formatBubbleTime(msg.sent_at)}
                    </Text>
                    {tickIcon()}
                  </View>
                </View>
              ) : (
                <View style={styles.bubbleMeta}>
                  <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.inkFaint }]}>
                    {formatBubbleTime(msg.sent_at)}
                  </Text>
                  {tickIcon()}
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.inkFaint }]}>
              Messages are end-to-end encrypted. No one outside of this chat can read them.
            </Text>
          </View>
        }
      />

      {selectedMsg && (
        <View style={[styles.contextOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <Pressable style={styles.contextBackdrop} onPress={() => setSelectedMsg(null)} />
          <View style={[styles.contextMenu, { backgroundColor: colors.surface }]}>
            <Text style={[styles.contextTitle, { color: colors.ink }]} numberOfLines={2}>{selectedMsg.message}</Text>
            <View style={[styles.contextDivider, { backgroundColor: colors.border }]} />
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

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable style={styles.iconBtn} onPress={sendImage}>
          <Ionicons name="add-circle-outline" size={28} color={colors.inkFaint} />
        </Pressable>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.background, height: Math.max(44, inputHeight) }]}
          placeholder="Type a message"
          placeholderTextColor={colors.inkFaint}
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
        <Pressable
          onPress={sendMessage}
          disabled={!text.trim() || sending}
          style={({ pressed }) => [
            styles.sendBtn,
            { backgroundColor: text.trim() ? '#00A884' : colors.border },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons
            name={text.trim() ? 'send' : 'mic'}
            size={20}
            color={text.trim() ? '#fff' : colors.inkFaint}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: spacing.sm, paddingBottom: spacing.xs, flexGrow: 1, justifyContent: 'flex-end' },
  dateSep: { alignItems: 'center', marginVertical: spacing.sm },
  datePill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  dateText: { fontSize: 12, fontWeight: '600' },
  bubble: { maxWidth: '80%', paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, marginBottom: 2 },
  bubbleTail: { borderRadius: radius.lg, borderBottomRightRadius: 4 },
  bubbleNoTail: { borderRadius: radius.lg },
  bubbleMe: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleContent: {},
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 1 },
  bubbleTime: { fontSize: 11 },
  chatImage: { width: 220, height: 260, borderRadius: radius.md, marginBottom: 4 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: spacing.sm, alignSelf: 'center', maxWidth: 280 },
  emptyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center', lineHeight: 18 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, paddingHorizontal: spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  iconBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  contextOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  contextBackdrop: { flex: 1 },
  contextMenu: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, paddingBottom: 34 },
  contextTitle: { ...typography.body, marginBottom: spacing.sm },
  contextDivider: { height: StyleSheet.hairlineWidth, marginBottom: spacing.sm },
  contextOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12 },
  contextOptionText: { ...typography.body, fontWeight: '600' },
});
