import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
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
import { useChat, useChatThread } from '@/context/ChatContext';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';
import type { ChatMessage } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type ChatRoute = RouteProp<RootStackParamList, 'ChatThread'>;

export function ChatThreadScreen() {
  const route = useRoute<ChatRoute>();
  const { profileA, profileB, otherName } = route.params;
  const { colors } = useTheme();
  const { t } = useI18n();
  const { sendMessage, markRead, sendTyping, connected } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Resolve the current user's profile IDs for this thread.
  const [myProfiles, setMyProfiles] = useState<number[]>([]);
  useEffect(() => {
    profileApi
      .mine()
      .then((profiles) => {
        setMyProfiles(profiles.map((p) => Number(p.id)));
      })
      .catch(() => {});
  }, []);

  const senderProfileId = myProfiles.includes(Number(profileA))
    ? profileA
    : myProfiles.includes(Number(profileB))
      ? profileB
      : profileA;

  // Merge a server-pushed message into local state (dedupe by id).
  const mergeMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
      return [...prev, msg];
    });
  }, []);

  useChatThread(profileA, profileB, mergeMessage);

  // Initial load gets the full history; afterwards socket events keep it live.
  useEffect(() => {
    chatApi
      .history(profileA, profileB)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileA, profileB]);

  // Mark messages read on open + when new messages arrive.
  useEffect(() => {
    if (!loading) markRead(profileA, profileB);
  }, [loading, messages.length, profileA, profileB, markRead]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage({
        profileA,
        profileB,
        senderProfileId,
        text: trimmed,
      });
      // Optimistic-insert via the socket deliver + REST fallback both return the saved row.
      setMessages((prev) =>
        prev.some((m) => String(m.id) === String(msg.id)) ? prev : [...prev, msg]
      );
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const onTyping = (value: string) => {
    setText(value);
    sendTyping(profileA, profileB, value.length > 0);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <Spinner />;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.flex}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = Number(item.sender_profile_id) === Number(senderProfileId);
            return (
              <View
                style={[
                  styles.bubble,
                  isMe
                    ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                    : [
                        styles.bubbleOther,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    isMe ? { color: colors.white } : { color: colors.ink },
                  ]}
                >
                  {item.message}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    isMe ? { color: colors.white } : { color: colors.inkFaint },
                  ]}
                >
                  {formatTime(item.sent_at)}
                  {isMe && item.delivered_at ? ' ✓' : ''}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.inkFaint }]}>{t('chatEmpty')}</Text>
          }
        />

        <View
          style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}
        >
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('chatPlaceholder')}
            placeholderTextColor={colors.inkFaint}
            value={text}
            onChangeText={onTyping}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: colors.primary },
              (!text.trim() || sending) && { backgroundColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color={!text.trim() || sending ? colors.inkFaint : colors.white}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.body.fontSize,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
});