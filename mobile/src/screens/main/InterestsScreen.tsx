import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {data.isLoading ? (
              <Text style={styles.empty}>Loading interests...</Text>
            ) : (
              <Text style={styles.empty}>
                No interests yet. Send one from a profile you like!
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
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.inkFaint,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
