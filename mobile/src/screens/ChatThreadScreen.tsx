import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const loadMessages = async () => {
    try {
      const data = await chatApi.history(profileA, profileB);
      setMessages(data);
    } catch {
      // keep stale messages
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
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
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
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: keyboardHeight > 0 ? 8 : spacing.md },
        ]}
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
                style={[styles.bubbleTime, isMe ? { color: colors.white } : { color: colors.inkFaint }]}
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

      <View
        style={[
          styles.inputRow,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.sm,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.background }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.inkFaint}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          onFocus={scrollToBottom}
        />
        <Pressable
          onPress={sendMessage}
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
