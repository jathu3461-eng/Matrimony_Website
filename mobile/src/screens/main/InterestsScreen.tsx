import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { interestApi } from '@/api/interests';
import { InterestRow } from '@/components/InterestRow';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function InterestsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const data = useQuery({
    queryKey: ['interests'],
    queryFn: () => interestApi.myInteractions(),
  });

  const received = data.data?.received ?? [];
  const sent = data.data?.sent ?? [];
  const receivedCount = received.length;

  const onRefresh = async () => {
    setRefreshing(true);
    await data.refetch();
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {data.isLoading ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="heart-outline" size={48} color={colors.inkFaint} />
            <Text style={[styles.emptyTitle, { color: colors.inkSoft }]}>Loading...</Text>
            <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>Fetching your interests</Text>
          </View>
        ) : received.length === 0 && sent.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="heart-outline" size={48} color={colors.inkFaint} />
            <Text style={[styles.emptyTitle, { color: colors.inkSoft }]}>No interests yet</Text>
            <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>Send an interest from a profile you like to get started</Text>
          </View>
        ) : (
          <>
            {received.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeader, { color: colors.inkFaint }]}>Received</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.countText, { color: colors.white }]}>{receivedCount}</Text>
                  </View>
                </View>
                {received.map((item) => (
                  <InterestRow
                    key={`r-${item.id}`}
                    interest={item}
                    direction="received"
                    onResponded={() => data.refetch()}
                    onPress={() => {
                      if (item.sender_id) navigation.navigate('ProfileDetail', { profileId: item.sender_id });
                    }}
                  />
                ))}
              </>
            )}
            {sent.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeader, { color: colors.inkFaint }]}>Sent</Text>
                </View>
                {sent.map((item) => (
                  <InterestRow
                    key={`s-${item.id}`}
                    interest={item}
                    direction="sent"
                    onResponded={() => data.refetch()}
                    onPress={() => {
                      if (item.receiver_id) navigation.navigate('ProfileDetail', { profileId: item.receiver_id });
                    }}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  countBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    ...typography.label,
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
