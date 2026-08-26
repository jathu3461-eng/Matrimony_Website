import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { profileApi, SearchParams } from '@/api/profiles';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { ProfileMeta } from '@/types';
import type { RootStackParamList } from '@/navigation/types';
import {
  INCOME_RANGE,
  MANGLIK,
} from '@/utils/validation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GENDER_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Male', value: 'M' as const },
  { label: 'Female', value: 'F' as const },
];

const AGE_OPTIONS = Array.from({ length: 50 }, (_, i) => ({
  value: String(i + 18),
  label: `${i + 18}`,
}));

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | undefined>(undefined);
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [religionId, setReligionId] = useState('');
  const [casteId, setCasteId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [raasiId, setRaasiId] = useState('');
  const [starId, setStarId] = useState('');
  const [incomeRange, setIncomeRange] = useState('');
  const [manglik, setManglik] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [applied, setApplied] = useState<SearchParams>({});
  const [refreshing, setRefreshing] = useState(false);

  const meta = useQuery({
    queryKey: ['meta'],
    queryFn: () => profileApi.getMeta(),
  });

  const metaData = meta.data as ProfileMeta | undefined;

  const results = useQuery({
    queryKey: ['search', applied],
    queryFn: () => profileApi.search(applied),
  });

  const activeFilterCount = [gender, minAge, maxAge, religionId, casteId, countryId, raasiId, starId, incomeRange, manglik].filter(Boolean).length;

  const applyFilters = (genderOverride?: 'M' | 'F' | undefined) => {
    const g = genderOverride !== undefined ? genderOverride : gender;
    const params: SearchParams = {};
    if (query.trim()) params.q = query.trim();
    if (g) params.gender = g;
    if (minAge) params.minAge = Number(minAge);
    if (maxAge) params.maxAge = Number(maxAge);
    if (religionId) params.religion_id = Number(religionId);
    if (casteId) params.caste_id = Number(casteId);
    if (countryId) params.current_country_id = countryId;
    if (raasiId) params.raasi_id = Number(raasiId);
    if (starId) params.star_id = Number(starId);
    setApplied(params);
  };

  const applyGender = (g: 'M' | 'F' | undefined) => {
    setGender(g);
    applyFilters(g);
  };

  const clearAll = () => {
    setGender(undefined);
    setMinAge('');
    setMaxAge('');
    setReligionId('');
    setCasteId('');
    setCountryId('');
    setRaasiId('');
    setStarId('');
    setIncomeRange('');
    setManglik('');
    setQuery('');
    setApplied({});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await results.refetch();
    setRefreshing(false);
  };

  const header = (
    <>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.inkFaint} />
        <TextInput
          style={[styles.searchInput, { color: colors.ink }]}
          placeholder="Name, occupation, city..."
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => applyFilters()}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {/* Filter toggle + clear */}
      <View style={styles.filterHeader}>
        <Pressable
          onPress={() => setShowFilters((s) => !s)}
          style={[styles.filterToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Ionicons name="filter" size={16} color={colors.primary} />
          <Text style={[styles.filterToggleText, { color: colors.inkSoft }]}>
            Filters
            {activeFilterCount > 0 && (
              <Text style={{ color: colors.primary }}> ({activeFilterCount})</Text>
            )}
          </Text>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.inkFaint}
          />
        </Pressable>

        {activeFilterCount > 0 && (
          <Button title="Clear All" variant="ghost" size="sm" onPress={clearAll} />
        )}
      </View>

      {/* Gender chips */}
      <View style={styles.genderRow}>
        {GENDER_FILTERS.map((f) => (
          <Pressable
            key={f.label}
            onPress={() => applyGender(f.value)}
            style={[
              styles.genderChip,
              {
                borderColor: gender === f.value ? colors.primary : colors.border,
                backgroundColor: gender === f.value ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.genderChipText,
                { color: gender === f.value ? colors.white : colors.inkSoft },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Expandable filters */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.ageRow}>
            <View style={styles.ageInput}>
              <SelectField
                label="Min Age"
                options={AGE_OPTIONS}
                value={minAge}
                onChange={setMinAge}
                placeholder="Min"
              />
            </View>
            <View style={styles.ageInput}>
              <SelectField
                label="Max Age"
                options={AGE_OPTIONS}
                value={maxAge}
                onChange={setMaxAge}
                placeholder="Max"
              />
            </View>
          </View>

          <SelectField
            label="Religion"
            options={(metaData?.religions || []).map((r) => ({
              value: String(r.id),
              label: r.name_en,
            }))}
            value={religionId}
            onChange={setReligionId}
            placeholder="Any religion"
          />

          <SelectField
            label="Caste"
            options={(metaData?.castes || []).map((c) => ({
              value: String(c.id),
              label: c.name_en,
            }))}
            value={casteId}
            onChange={setCasteId}
            placeholder="Any caste"
          />

          <SelectField
            label="Country"
            options={(metaData?.countries || []).map((c) => ({
              value: c.code,
              label: c.name_en,
            }))}
            value={countryId}
            onChange={setCountryId}
            placeholder="Any country"
          />

          <View style={styles.ageRow}>
            <View style={styles.ageInput}>
              <SelectField
                label="Raasi"
                options={(metaData?.raasis || []).map((r) => ({
                  value: String(r.id),
                  label: r.name_en,
                }))}
                value={raasiId}
                onChange={setRaasiId}
                placeholder="Any"
              />
            </View>
            <View style={styles.ageInput}>
              <SelectField
                label="Star"
                options={(metaData?.stars || []).map((s) => ({
                  value: String(s.id),
                  label: s.name_en,
                }))}
                value={starId}
                onChange={setStarId}
                placeholder="Any"
              />
            </View>
          </View>

          <SelectField
            label="Income Range"
            options={INCOME_RANGE}
            value={incomeRange}
            onChange={setIncomeRange}
            placeholder="Any income"
          />

          <SelectField
            label="Manglik Status"
            options={MANGLIK}
            value={manglik}
            onChange={setManglik}
            placeholder="Any"
          />
        </View>
      )}

      {results.data && results.data.length > 0 && (
        <Text style={[styles.count, { color: colors.inkFaint }]}>{results.data.length} profiles found</Text>
      )}
    </>
  );

  return (
    <Screen>
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
        ListHeaderComponent={header}
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
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  filterToggleText: {
    ...typography.caption,
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  genderChip: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  genderChipText: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
  },
  filterPanel: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  ageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ageInput: {
    flex: 1,
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
