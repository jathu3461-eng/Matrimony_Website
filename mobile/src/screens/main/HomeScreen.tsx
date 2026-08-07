import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { profileApi } from '@/api/profiles';
import { ProfileCard } from '@/components/ProfileCard';
import { useAppSelector } from '@/store/hooks';
import { colors, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAppSelector((s) => s.auth.user);
  const [refreshing, setRefreshing] = useState(false);

  const matches = useQuery({
    queryKey: ['matches', 'recent'],
    queryFn: () => profileApi.search({ limit: 10 }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await matches.refetch();
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>
          Namaste, {user?.username ?? 'friend'}
        </Text>
        <Text style={styles.subGreeting}>Your trusted Tamil matrimony companion</Text>

        <View style={styles.quickActions}>
          <Button
            title="Browse Profiles"
            size="md"
            style={styles.quickBtn}
            onPress={() => navigation.navigate('Main', { screen: 'Search' })}
          />
          <Button
            title="Create Profile"
            variant="outline"
            size="md"
            style={styles.quickBtn}
            onPress={() => navigation.navigate('CreateProfile')}
          />
        </View>

        <Text style={styles.sectionTitle}>Fresh matches</Text>
        {matches.isLoading ? (
          <Text style={styles.empty}>Loading profiles...</Text>
        ) : matches.data && matches.data.length > 0 ? (
          matches.data.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onPress={() => navigation.navigate('ProfileDetail', { profileId: p.id })}
            />
          ))
        ) : (
          <Text style={styles.empty}>
            No profiles yet. Create your profile to start receiving matches.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    ...typography.title,
    color: colors.ink,
  },
  subGreeting: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.inkFaint,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
});
