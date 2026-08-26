import { useState, useCallback, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi } from '@/api/notifications';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import { badgeEvents } from '@/lib/badgeEvents';
import type { NotificationItem } from '@/types';

function groupByDate(items: NotificationItem[]): { title: string; data: NotificationItem[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, NotificationItem[]> = { Today: [], Yesterday: [], 'This Week': [], Older: [] };

  for (const item of items) {
    const d = new Date(item.created_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day.getTime() >= today.getTime()) groups.Today.push(item);
    else if (day.getTime() >= yesterday.getTime()) groups.Yesterday.push(item);
    else if (day.getTime() >= weekAgo.getTime()) groups['This Week'].push(item);
    else groups.Older.push(item);
  }

  const result: { title: string; data: NotificationItem[] }[] = [];
  for (const [title, data] of Object.entries(groups)) {
    if (data.length > 0) result.push({ title, data });
  }
  return result;
}

export function NotificationsScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const data = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
  });

  const unreadCount = useMemo(
    () => (data.data ?? []).filter((n) => n.is_read === 0).length,
    [data.data],
  );

  const groups = useMemo(() => groupByDate(data.data ?? []), [data.data]);

  useFocusEffect(
    useCallback(() => {
      data.refetch();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await data.refetch();
    setRefreshing(false);
  };

  const markOneRead = async (item: NotificationItem) => {
    if (item.is_read !== 0) return;
    try {
      await notificationApi.markRead(item.id);
      data.refetch();
      badgeEvents.emit('notifications:read');
    } catch {}
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      data.refetch();
      badgeEvents.emit('notifications:read');
    } catch {}
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interest_received': return 'heart';
      case 'interest_accepted': return 'checkmark-done';
      case 'message': return 'chatbubble';
      case 'profile_view': return 'eye';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'interest_received': return colors.primary;
      case 'interest_accepted': return '#22c55e';
      case 'message': return '#3b82f6';
      case 'profile_view': return '#f59e0b';
      default: return colors.inkFaint;
    }
  };

  const renderSectionHeader = (title: string) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>{title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = item.is_read === 0;
    const icon = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <Pressable
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isUnread && { borderColor: iconColor, backgroundColor: `${iconColor}08` },
        ]}
        onPress={() => markOneRead(item)}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <View style={styles.details}>
          <Text
            style={[
              styles.message,
              { color: colors.ink },
              isUnread && { fontWeight: '700' },
            ]}
            numberOfLines={3}
          >
            {item.message}
          </Text>
          <Text style={[styles.time, { color: colors.inkFaint }]}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>
        {isUnread && <View style={[styles.dot, { backgroundColor: iconColor }]} />}
      </Pressable>
    );
  };

  const sections = groups.flatMap((g) => [
    { type: 'header' as const, title: g.title },
    ...g.data.map((item) => ({ type: 'item' as const, item })),
  ]);

  return (
    <Screen>
      {unreadCount > 0 && (
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.unreadText, { color: colors.inkFaint }]}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <Pressable onPress={markAll} style={[styles.markAllBtn, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="checkmark-done" size={16} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={sections}
        keyExtractor={(item, i) =>
          item.type === 'header' ? `hdr-${item.title}` : `notif-${(item as any).item.id}-${i}`
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === 'header') return renderSectionHeader(item.title);
          return renderItem({ item: (item as any).item });
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="notifications-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              {data.isLoading ? 'Loading...' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>
              {data.isLoading
                ? 'Fetching your notifications'
                : 'When someone shows interest or accepts yours, you will see it here'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  unreadText: {
    ...typography.caption,
    fontWeight: '600',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    ...typography.caption,
    fontWeight: '700',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  message: {
    ...typography.body,
    lineHeight: 20,
  },
  time: {
    ...typography.label,
    marginTop: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.xs,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 1.5,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
