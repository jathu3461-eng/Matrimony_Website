import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '@/api/chat';
import { profileApi } from '@/api/profiles';
import { Spinner } from '@/components/Spinner';
import { Screen } from '@/components/Screen';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { ChatMessage } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type ChatRoute = RouteProp<RootStackParamList, 'ChatThread'>;

export function ChatThreadScreen() {
  const route = useRoute<ChatRoute>();
  const { profileA, profileB, otherName } = route.params;
  const { colors } = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputHeight, setInputHeight] = useState(44);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myProfileId = useAppSelector((s) => s.auth.user?.id);

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
    pollRef.current = setInterval(loadMessages, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [profileA, profileB]);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => scrollToBottom(),
    );
    return () => { showSub.remove(); };
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

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <Spinner />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          renderItem={({ item }) => {
            const isMe = Number(item.sender_profile_id) === Number(senderProfileId);
            return (
              <View
                style={[
                  styles.bubble,
                  isMe
                    ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                    : [styles.bubbleOther, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                <Text style={[styles.bubbleText, isMe ? { color: colors.white } : { color: colors.ink }]}>
                  {item.message}
                </Text>
                <Text
                  style={[styles.bubbleTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.inkFaint }]}
                >
                  {formatTime(item.sent_at)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.inkFaint }]}>No messages yet. Say hello!</Text>
          }
        />
      </View>

      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable style={styles.emojiBtn}>
          <Ionicons name="happy-outline" size={24} color={colors.inkFaint} />
        </Pressable>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.ink,
              backgroundColor: colors.background,
              height: Math.max(44, inputHeight),
            },
          ]}
          placeholder="Type a message..."
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
            {
              backgroundColor: text.trim() ? colors.primary : colors.border,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons
            name={text.trim() ? 'send' : 'mic'}
            size={20}
            color={text.trim() ? colors.white : colors.inkFaint}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...typography.body,
    lineHeight: 20,
  },
  bubbleTime: {
    ...typography.label,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.75,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emojiBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: typography.body.fontSize,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
});
