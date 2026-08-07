import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { profileApi, SearchParams } from '@/api/profiles';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState<SearchParams>({});
  const [refreshing, setRefreshing] = useState(false);

  const results = useQuery({
    queryKey: ['search', applied],
    queryFn: () => profileApi.search(applied),
    enabled: true,
  });

  const runSearch = () => {
    const params: SearchParams = {};
    if (query.trim()) params.q = query.trim();
    setApplied(params);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await results.refetch();
    setRefreshing(false);
  };

  return (
    <Screen>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.inkFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Name, occupation, city..."
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={results.data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProfileCard
            profile={item}
            onPress={() => navigation.navigate('ProfileDetail', { profileId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {results.isLoading ? (
              <Text style={styles.empty}>Searching...</Text>
            ) : (
              <Text style={styles.empty}>
                {Object.keys(applied).length === 0
                  ? 'Type a keyword above and press search.'
                  : 'No profiles matched your search.'}
              </Text>
            )}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.ink,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
