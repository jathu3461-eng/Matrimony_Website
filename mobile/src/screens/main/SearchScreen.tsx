import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { profileApi, SearchParams } from '@/api/profiles';
import { ProfileCard } from '@/components/ProfileCard';
import { SearchablePicker } from '@/components/SearchablePicker';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const HEIGHT_CM_OPTIONS: { value: string; label: string }[] = [];
for (let cm = 140; cm <= 200; cm += 5) {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) inches = 0;
  HEIGHT_CM_OPTIONS.push({ value: String(cm), label: `${cm} cm — ${ft}'${inches}"` });
}

const FT_IN_OPTIONS: { value: string; label: string }[] = [];
for (let ft = 4; ft <= 7; ft++) {
  for (let inch = 0; inch <= 11; inch += 1) {
    const cmVal = Math.round(((ft * 12 + inch) * 2.54));
    FT_IN_OPTIONS.push({ value: String(cmVal), label: `${cmVal} cm — ${ft}'${inch}"` });
  }
}

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | undefined>(undefined);
  const [religionId, setReligionId] = useState<string>('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minHeight, setMinHeight] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [applied, setApplied] = useState<SearchParams>({});
  const [refreshing, setRefreshing] = useState(false);

  const meta = useQuery({
    queryKey: ['profile-meta'],
    queryFn: () => profileApi.getMeta(),
  });

  const results = useQuery({
    queryKey: ['search', applied],
    queryFn: () => profileApi.search(applied),
  });

  const runSearch = () => {
    const params: SearchParams = {};
    if (query.trim()) params.q = query.trim();
    if (gender) params.gender = gender;
    if (religionId) params.religion_id = Number(religionId);
    if (minAge.trim()) params.minAge = Number(minAge.trim());
    if (maxAge.trim()) params.maxAge = Number(maxAge.trim());
    if (minHeight.trim()) params.min_height_cm = Number(minHeight.trim());
    if (maxHeight.trim()) params.max_height_cm = Number(maxHeight.trim());
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
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        <Button
          title={t('lookingForGroom')}
          variant={gender === 'M' ? 'primary' : 'outline'}
          size="sm"
          onPress={() => { setGender('M'); }}
        />
        <Button
          title={t('lookingForBride')}
          variant={gender === 'F' ? 'primary' : 'outline'}
          size="sm"
          onPress={() => { setGender('F'); }}
        />
        <Button
          title={t('filters')}
          variant={showFilters ? 'primary' : 'outline'}
          size="sm"
          onPress={() => setShowFilters(!showFilters)}
          leftIcon="filter"
        />
        <Button title={t('searchButton')} size="sm" onPress={runSearch} />
      </View>

      {showFilters && meta.data && (
        <View style={[styles.filtersSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SearchablePicker
            label={t('religion')}
            options={[
              { value: '', label: t('allReligions') },
              ...meta.data.religions.map((r) => ({ value: r.id, label: r.name_en })),
            ]}
            value={religionId}
            onChange={(v) => setReligionId(v)}
          />
          <View style={styles.ageRow}>
            <TextInput
              style={[styles.ageInput, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface }]}
              placeholder={t('minAge')}
              placeholderTextColor={colors.inkFaint}
              value={minAge}
              onChangeText={setMinAge}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={{ color: colors.inkFaint }}>–</Text>
            <TextInput
              style={[styles.ageInput, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface }]}
              placeholder={t('maxAge')}
              placeholderTextColor={colors.inkFaint}
              value={maxAge}
              onChangeText={setMaxAge}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.filterLabel, { color: colors.ink }]}>{t('height')}</Text>
            <View style={styles.ageRow}>
              <SearchablePicker
                label={t('minHeight')}
                options={HEIGHT_CM_OPTIONS}
                value={minHeight}
                onChange={setMinHeight}
              />
              <Text style={{ color: colors.inkFaint, marginHorizontal: 4 }}>–</Text>
              <SearchablePicker
                label={t('maxHeight')}
                options={HEIGHT_CM_OPTIONS}
                value={maxHeight}
                onChange={setMaxHeight}
              />
            </View>
          </View>
        </View>
      )}

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
            <Text style={[styles.count, { color: colors.inkFaint }]}>{t('profilesFound', { count: results.data.length })}</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {results.isLoading ? (
              <Text style={[styles.empty, { color: colors.inkFaint }]}>{t('loading')}</Text>
            ) : (
              <>
                <Ionicons name="search-outline" size={48} color={colors.inkFaint} />
                <Text style={[styles.empty, { color: colors.inkFaint }]}>
                  {Object.keys(applied).length === 0
                    ? t('searchHint')
                    : t('noProfilesMatch')}
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
    flexWrap: 'wrap',
  },
  filtersSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.body.fontSize,
  },
  filterLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
