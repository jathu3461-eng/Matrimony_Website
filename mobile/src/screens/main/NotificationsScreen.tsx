import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi } from '@/api/notifications';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/theme';

export function NotificationsScreen() {
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
            style={[styles.row, item.is_read === 0 && styles.rowUnread]}
            onPress={async () => {
              if (item.is_read === 0) {
                await notificationApi.markRead(item.id);
                data.refetch();
              }
            }}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={item.type === 'interest_accepted' ? 'checkmark-done' : 'heart'}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.details}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            {item.is_read === 0 && <View style={styles.dot} />}
          </Pressable>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          (data.data?.length ?? 0) > 0 ? (
            <Pressable onPress={markAll} style={styles.markAll}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {data.isLoading ? (
              <Text style={styles.empty}>Loading notifications...</Text>
            ) : (
              <Text style={styles.empty}>No notifications yet.</Text>
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  message: {
    ...typography.body,
    color: colors.ink,
  },
  time: {
    ...typography.label,
    color: colors.inkFaint,
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  markAll: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
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
