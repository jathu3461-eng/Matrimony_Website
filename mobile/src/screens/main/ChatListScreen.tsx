import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '@/api/chat';
import { profileApi } from '@/api/profiles';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { ChatThread } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const APP_NAME_RE = /mukurtham\s*matrimony/i;
function sanitizeName(name?: string | null): string {
  if (!name || !name.trim()) return 'Member';
  if (APP_NAME_RE.test(name.trim())) return 'Member';
  return name.trim();
}

function formatListTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ChatListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const threads = useQuery({
    queryKey: ['chat', 'threads'],
    queryFn: () => chatApi.threads(),
  });

  const myProfiles = useQuery({
    queryKey: ['my-profiles'],
    queryFn: () => profileApi.mine(),
  });

  const myProfileIds = useMemo(
    () => new Set((myProfiles.data ?? []).map((p) => Number(p.id))),
    [myProfiles.data],
  );

  const enrichThread = useCallback(
    (t: ChatThread) => {
      const myProfileId = myProfileIds.has(Number(t.sender_profile_id))
        ? t.sender_profile_id
        : t.receiver_profile_id;
      const otherProfileId = myProfileId === t.sender_profile_id ? t.receiver_profile_id : t.sender_profile_id;
      const otherName = sanitizeName(myProfileId === t.sender_profile_id ? t.receiver_name : t.sender_name);
      const isFromMe = Number(t.last_sender_profile_id) === Number(myProfileId);
      return { ...t, myProfileId, otherProfileId, otherName, isFromMe };
    },
    [myProfileIds],
  );

  useFocusEffect(
    useCallback(() => {
      threads.refetch();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([threads.refetch(), myProfiles.refetch()]);
    setRefreshing(false);
  };

  return (
    <FlatList
      data={(threads.data ?? []).map(enrichThread)}
      keyExtractor={(item) => item.thread_id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border },
              pressed && { backgroundColor: colors.primarySoft },
            ]}
            onPress={() =>
              navigation.navigate('ChatThread', {
                profileA: item.myProfileId,
                profileB: item.otherProfileId,
                otherName: item.otherName,
              })
            }
          >
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.white }]}>
                  {(item.otherName ?? '?')[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            </View>

            <View style={styles.details}>
              <View style={styles.rowTop}>
                <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                  {item.otherName}
                </Text>
                <Text style={[styles.time, { color: item.unread_count > 0 ? '#25D366' : colors.inkFaint }]}>
                  {formatListTime(item.last_at)}
                </Text>
              </View>
              <View style={styles.rowBottom}>
                <View style={styles.lastMsgWrap}>
                  {item.isFromMe && (
                    <Ionicons
                      name={item.unread_count === 0 && item.last_message ? 'checkmark-done' : 'checkmark'}
                      size={16}
                      color={item.unread_count === 0 && item.last_message ? '#53BDEB' : colors.inkFaint}
                      style={styles.tickIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.last,
                      { color: item.unread_count > 0 ? colors.ink : colors.inkSoft },
                      item.unread_count > 0 && { fontWeight: '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.last_message || 'Start the conversation'}
                  </Text>
                </View>
                {item.unread_count > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#25D366' }]}>
                    <Text style={[styles.badgeText, { color: '#fff' }]}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.inkFaint} />
          <Text style={[styles.emptyTitle, { color: colors.inkSoft }]}>
            {threads.isLoading ? 'Loading...' : 'No conversations yet'}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>
            {threads.isLoading
              ? 'Fetching your chats'
              : 'Send an interest to start chatting with someone special'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  details: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.body, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  time: { fontSize: 12 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  lastMsgWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  tickIcon: { marginRight: 3 },
  last: { ...typography.caption, flex: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.title, marginTop: spacing.sm },
  emptyHint: { ...typography.body, textAlign: 'center', maxWidth: 260 },
});
