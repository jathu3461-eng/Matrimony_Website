import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '@/api/chat';
import { uploadsUrl } from '@/api/client';
import { profileApi } from '@/api/profiles';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/theme';
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
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate('ChatThread', {
                profileA: item.myProfileId,
                profileB: item.otherProfileId,
                otherName: item.otherName,
              })
            }
          >
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={22} color={colors.inkFaint} />
            </View>
            <View style={styles.details}>
              <View style={styles.rowTop}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.otherName}
                </Text>
                <Text style={styles.time}>{timeAgo(item.last_at)}</Text>
              </View>
              <View style={styles.rowBottom}>
                <Text style={styles.last} numberOfLines={1}>
                  {item.last_message || 'Start the conversation'}
                </Text>
                {item.unread_count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {threads.isLoading ? (
              <Text style={styles.empty}>Loading chats...</Text>
            ) : (
              <Text style={styles.empty}>
                No conversations yet. Send an interest to start chatting.
              </Text>
            )}
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.primarySoft,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.ink,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.label,
    color: colors.inkFaint,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  last: {
    ...typography.caption,
    color: colors.inkSoft,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
