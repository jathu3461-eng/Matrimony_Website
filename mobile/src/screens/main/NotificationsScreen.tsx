import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi } from '@/api/notifications';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';

export function NotificationsScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const data = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await data.refetch();
    setRefreshing(false);
  };

  const markAll = async () => {
    await notificationApi.markAllRead();
    data.refetch();
  };

  return (
    <Screen>
      <FlatList
        data={data.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.row,
              { backgroundColor: colors.surface, borderColor: colors.border },
              item.is_read === 0 && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
            ]}
            onPress={async () => {
              if (item.is_read === 0) {
                await notificationApi.markRead(item.id);
                data.refetch();
              }
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
              <Ionicons
                name={item.type === 'interest_accepted' ? 'checkmark-done' : 'heart'}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.details}>
              <Text style={[styles.message, { color: colors.ink }]}>{item.message}</Text>
              <Text style={[styles.time, { color: colors.inkFaint }]}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            {item.is_read === 0 && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          (data.data?.length ?? 0) > 0 ? (
            <Pressable onPress={markAll} style={styles.markAll}>
              <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-outline" size={48} color={colors.inkFaint} />
            <Text style={[styles.emptyTitle, { color: colors.inkSoft }]}>
              {data.isLoading ? 'Loading...' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>
              {data.isLoading
                ? 'Fetching notifications'
                : 'When someone shows interest or accepts yours, you will see it here'}
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
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  message: {
    ...typography.body,
  },
  time: {
    ...typography.label,
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  markAll: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  markAllText: {
    ...typography.caption,
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
