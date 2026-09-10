import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { interestApi } from '@/api/interests';
import { InterestRow } from '@/components/InterestRow';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function InterestsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);

  const data = useQuery({
    queryKey: ['interests'],
    queryFn: () => interestApi.myInteractions(),
  });

  const sections = useMemo(() => {
    const received = data.data?.received ?? [];
    const sent = data.data?.sent ?? [];
    return [
      { title: t('navNotifications'), data: received, key: 'received' as const },
      { title: t('interestSent'), data: sent, key: 'sent' as const },
    ].filter((s) => s.data.length > 0);
  }, [data.data, t]);

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
            direction={section.key}
            onResponded={() => data.refetch()}
            onPress={() => {
              const id = section.key === 'received' ? item.sender_id : item.receiver_id;
              if (id) navigation.navigate('ProfileDetail', { profileId: id });
            }}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeader, { color: colors.inkFaint }]}>{section.title}</Text>
            {section.key === 'received' && receivedCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.countText, { color: colors.white }]}>{receivedCount}</Text>
              </View>
            )}
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="heart-outline" size={48} color={colors.inkFaint} />
            <Text style={[styles.emptyTitle, { color: colors.inkSoft }]}>
              {data.isLoading ? t('loading') : t('chatNoThreads')}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>
              {data.isLoading
                ? t('loading')
                : t('sendInterest')}
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
