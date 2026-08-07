import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { interestApi } from '@/api/interests';
import { InterestRow } from '@/components/InterestRow';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function InterestsScreen() {
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);

  const data = useQuery({
    queryKey: ['interests'],
    queryFn: () => interestApi.myInteractions(),
  });

  const sections = useMemo(() => {
    const received = data.data?.received ?? [];
    const sent = data.data?.sent ?? [];
    return [
      { title: 'Received', data: received },
      { title: 'Sent', data: sent },
    ].filter((s) => s.data.length > 0);
  }, [data.data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await data.refetch();
    setRefreshing(false);
  };

  const receivedCount = data.data?.received?.length ?? 0;

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, section }) => (
          <InterestRow
            interest={item}
            direction={section.title === 'Received' ? 'received' : 'sent'}
            onResponded={() => data.refetch()}
            onPress={() => {
              const id = section.title === 'Received' ? item.sender_id : item.receiver_id;
              if (id) navigation.navigate('ProfileDetail', { profileId: id });
            }}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.title === 'Received' && receivedCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{receivedCount}</Text>
              </View>
            )}
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {data.isLoading ? (
              <Ionicons name="heart-outline" size={48} color={colors.inkFaint} />
            ) : (
              <Ionicons name="heart-outline" size={48} color={colors.inkFaint} />
            )}
            <Text style={styles.emptyTitle}>
              {data.isLoading ? 'Loading...' : 'No interests yet'}
            </Text>
            <Text style={styles.emptyHint}>
              {data.isLoading
                ? 'Fetching your interests'
                : 'Send an interest from a profile you like to get started'}
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
    color: colors.inkFaint,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  emptyHint: {
    ...typography.body,
    color: colors.inkFaint,
    textAlign: 'center',
    maxWidth: 260,
  },
});
