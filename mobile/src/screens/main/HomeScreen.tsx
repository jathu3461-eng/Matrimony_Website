import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ProfileCard } from '@/components/ProfileCard';
import { profileApi } from '@/api/profiles';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((s) => s.auth.user);
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const matches = useQuery({
    queryKey: ['matches', 'recent'],
    queryFn: () => profileApi.search({}),
  });

  useFocusEffect(
    useCallback(() => {
      matches.refetch();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await matches.refetch();
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.hero}>
          <View>
            <Text style={[styles.greeting, { color: colors.inkSoft }]}>Namaste,</Text>
            <Text style={[styles.name, { color: colors.ink }]}>{user?.username ?? 'friend'} 👋</Text>
          </View>
          <View style={styles.heroActions}>
            <Button
              title="Create Profile"
              size="sm"
              onPress={() => navigation.navigate('CreateProfile')}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <Text style={[styles.statNum, { color: colors.ink }]}>{matches.data?.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.inkFaint }]}>Profiles</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="heart" size={20} color={colors.primary} />
            <Text style={[styles.statNum, { color: colors.ink }]}>New</Text>
            <Text style={[styles.statLabel, { color: colors.inkFaint }]}>Matches</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="chatbubble" size={20} color={colors.success} />
            <Text style={[styles.statNum, { color: colors.ink }]}>Live</Text>
            <Text style={[styles.statLabel, { color: colors.inkFaint }]}>Chat</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Fresh Matches</Text>
          <Button
            title="View All"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Main', { screen: 'Search' })}
          />
        </View>

        {matches.isLoading ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.empty, { color: colors.inkFaint }]}>Loading profiles...</Text>
          </View>
        ) : matches.data && matches.data.length > 0 ? (
          matches.data.slice(0, 10).map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onPress={() => navigation.navigate('ProfileDetail', { profileId: p.id })}
            />
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="person-add" size={40} color={colors.inkFaint} />
            <Text style={[styles.empty, { color: colors.inkFaint }]}>No profiles yet.</Text>
            <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>
              Create your profile to start receiving matches
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    ...typography.body,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  heroActions: {},
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.xs,
  },
  statNum: {
    ...typography.body,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.label,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyHint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
