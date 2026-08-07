import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { profileApi, SearchParams } from '@/api/profiles';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GENDER_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Male', value: 'M' as const },
  { label: 'Female', value: 'F' as const },
];

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | undefined>(undefined);
  const [applied, setApplied] = useState<SearchParams>({});
  const [refreshing, setRefreshing] = useState(false);

  const results = useQuery({
    queryKey: ['search', applied],
    queryFn: () => profileApi.search(applied),
  });

  const runSearch = () => {
    const params: SearchParams = {};
    if (query.trim()) params.q = query.trim();
    if (gender) params.gender = gender;
    setApplied(params);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await results.refetch();
    setRefreshing(false);
  };

  return (
    <Screen>
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.inkFaint} />
        <TextInput
          style={[styles.searchInput, { color: colors.ink }]}
          placeholder="Name, occupation, city..."
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        {GENDER_FILTERS.map((f) => (
          <Button
            key={f.label}
            title={f.label}
            variant={gender === f.value ? 'primary' : 'outline'}
            size="sm"
            onPress={() => { setGender(f.value); }}
          />
        ))}
        <Button title="Search" size="sm" onPress={runSearch} />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          results.data && results.data.length > 0 ? (
            <Text style={[styles.count, { color: colors.inkFaint }]}>{results.data.length} profiles found</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {results.isLoading ? (
              <Text style={[styles.empty, { color: colors.inkFaint }]}>Searching...</Text>
            ) : (
              <>
                <Ionicons name="search-outline" size={48} color={colors.inkFaint} />
                <Text style={[styles.empty, { color: colors.inkFaint }]}>
                  {Object.keys(applied).length === 0
                    ? 'Search by name, occupation, or city'
                    : 'No profiles matched your search'}
                </Text>
              </>
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: spacing.sm,
    fontSize: typography.body.fontSize,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  count: {
    ...typography.caption,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
  },
});
