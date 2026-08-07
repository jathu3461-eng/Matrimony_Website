import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '@/api/chat';
import { profileApi } from '@/api/profiles';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { ChatThread } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
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
    [myProfiles.data]
  );

  const enrichThread = useCallback(
    (t: ChatThread) => {
      const myProfileId = myProfileIds.has(Number(t.sender_profile_id))
        ? t.sender_profile_id
        : t.receiver_profile_id;
      const otherProfileId = myProfileId === t.sender_profile_id ? t.receiver_profile_id : t.sender_profile_id;
      const otherName = myProfileId === t.sender_profile_id ? t.receiver_name : t.sender_name;
      const otherPic = null; // threads don't include pictures; resolved in the chat view
      return { ...t, myProfileId, otherProfileId, otherName, otherPic };
    },
    [myProfileIds]
  );

  useFocusEffect(
    useCallback(() => {
      threads.refetch();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([threads.refetch(), myProfiles.refetch()]);
    setRefreshing(false);
  };

  return (
    <Screen>
      <FlatList
        data={(threads.data ?? []).map(enrichThread)}
        keyExtractor={(item) => item.thread_id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('ChatThread', {
                profileA: item.myProfileId,
                profileB: item.otherProfileId,
                otherName: item.otherName,
              })
            }
          >
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(item.otherName ?? '?')[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.details}>
              <View style={styles.rowTop}>
                <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
                  {item.otherName}
                </Text>
                <Text style={[styles.time, { color: colors.inkFaint }]}>{timeAgo(item.last_at)}</Text>
              </View>
              <View style={styles.rowBottom}>
                <Text style={[styles.last, { color: colors.inkSoft }]} numberOfLines={1}>
                  {item.last_message || 'Start the conversation'}
                </Text>
                {item.unread_count > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { color: colors.white }]}>{item.unread_count}</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.body,
    fontWeight: '700',
  },
  details: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.label,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  last: {
    ...typography.caption,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    marginTop: spacing.sm,
  },
  emptyHint: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 260,
  },
});
