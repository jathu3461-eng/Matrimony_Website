import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '@/api/profiles';
import { interestApi } from '@/api/interests';
import { uploadsUrl, extractError } from '@/api/client';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { Screen } from '@/components/Screen';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';
import type { Profile } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type DetailRoute = RouteProp<RootStackParamList, 'ProfileDetail'>;

interface MatchDetail {
  matched: boolean;
  points: number;
  desc: string;
}

interface MatchResult {
  score: number;
  details: Record<string, MatchDetail>;
}

function displayName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function heightToCm(feet: number, inches: number): number {
  return Math.round((Number(feet || 0) * 12 + Number(inches || 0)) * 2.54);
}

export function ProfileDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profileId } = route.params;
  const user = useAppSelector((s) => s.auth.user);
  const { colors } = useTheme();
  const { t } = useI18n();

  const [interestMsg, setInterestMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 10-Porutham panel state
  const [matchProfileId, setMatchProfileId] = useState<string>('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => profileApi.getById(profileId),
  });

  const myProfiles = useQuery({
    queryKey: ['my-profiles'],
    queryFn: () => profileApi.mine(),
  });

  const meta = useQuery({
    queryKey: ['profile-meta'],
    queryFn: () => profileApi.getMeta(),
  });

  const p = profile.data;

  const sendInterest = async () => {
    if (!p) return;
    setSending(true);
    try {
      await interestApi.send(p.id, interestMsg.trim() || undefined);
      setInterestMsg('');
      Alert.alert(t('interestModalTitle'), 'Your interest has been sent successfully.');
      profile.refetch();
    } catch (err) {
      Alert.alert(t('error'), extractError(err, 'Failed to send interest.'));
    } finally {
      setSending(false);
    }
  };

  const toggleShortlist = async () => {
    if (!p) return;
    setShortlisting(true);
    try {
      const shortlisted = await interestApi.toggleShortlist(p.id);
      Alert.alert(shortlisted ? t('shortlisted') : t('unshortlist'));
      profile.refetch();
    } catch {
      Alert.alert(t('error'), 'Could not update shortlist.');
    } finally {
      setShortlisting(false);
    }
  };

  const uploadPhoto = async () => {
    if (!p) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;

    setUploading(true);
    try {
      const formData = new FormData();
      const uri = res.assets[0].uri;
      const ext = uri.split('.').pop() || 'jpg';
      formData.append('main_profile_picture', {
        uri,
        name: `profile.${ext}`,
        type: `image/${ext}`,
      } as unknown as Blob);
      await profileApi.update(p.id, formData);
      Alert.alert(t('success'));
      profile.refetch();
    } catch (err) {
      Alert.alert(t('error'), extractError(err, 'Failed to upload photo.'));
    } finally {
      setUploading(false);
    }
  };

  const calculateMatch = async () => {
    if (!p) return;
    const mine = myProfiles.data ?? [];
    const targetId = matchProfileId || (mine.length > 0 ? String(mine[0].id) : '');
    if (!targetId) return;
    setMatchLoading(true);
    setMatchError(null);
    setMatchResult(null);
    try {
      const result = await profileApi.match(Number(targetId), p.id);
      setMatchResult(result);
    } catch (err) {
      setMatchError(extractError(err, t('matchMissingDetails')));
    } finally {
      setMatchLoading(false);
    }
  };

  if (profile.isLoading) return <Spinner />;
  if (profile.isError || !p)
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={48} color={colors.inkFaint} />
          <Text style={[styles.emptyText, { color: colors.inkFaint }]}>{t('profileNotFound')}</Text>
        </View>
      </Screen>
    );

  const photoUrl = uploadsUrl(p.main_profile_picture);
  const isOwnProfile = user?.id === p.owner_user_id;
  const isShortlisted = p.is_shortlisted === 1;
  const interestStatus = p.interest_status;
  const lookingFor = p.gender === 'M' ? t('lookingForGroom') : t('lookingForBride');
  const heightCm = heightToCm(p.height_feet, p.height_inches);
  const heightLabel = heightCm ? `${heightCm} cm — ${p.height_feet}'${p.height_inches ?? 0}"` : '';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photoWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={[styles.photo, { backgroundColor: colors.primarySoft }]} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="person" size={64} color={colors.inkFaint} />
            </View>
          )}
          {isOwnProfile && (
            <Pressable
              style={[styles.editPhotoBtn, { backgroundColor: colors.primary }]}
              onPress={uploadPhoto}
              disabled={uploading}
            >
              <Ionicons name="camera" size={18} color={colors.white} />
            </Pressable>
          )}
        </View>

        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.ink }]}>{p.name}</Text>
          {p.is_verified === 1 && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text style={[styles.verifiedText, { color: colors.success }]}>{t('verifiedBadge')}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.subtitle, { color: colors.inkSoft }]}>
          {p.age} {t('years')} · {lookingFor}
        </Text>

        <View style={styles.heightRow}>
          <View style={[styles.heightChip, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="resize" size={14} color={colors.primary} />
            <Text style={[styles.heightChipText, { color: colors.primary }]}>{heightLabel}</Text>
          </View>
        </View>

        {isOwnProfile && (
          <Pressable
            style={[styles.editProfileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('ProfileWizard', { editId: p.id, mode: 'edit' })}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.editProfileText, { color: colors.primary }]}>{t('editProfile')}</Text>
          </Pressable>
        )}

        <View style={styles.metaGrid}>
          {p.occupation && <MetaRow icon="briefcase" label={t('metaOccupation')} value={p.occupation} />}
          {p.education && <MetaRow icon="school" label={t('metaEducation')} value={p.education} />}
          {p.city_or_state && <MetaRow icon="location" label={t('metaLocation')} value={p.city_or_state} />}
          {p.religion_id && (
            <MetaRow
              icon="book"
              label={t('metaReligion')}
              value={meta.data?.religions.find((r) => r.id === p.religion_id)?.name_en ?? `Religion #${p.religion_id}`}
            />
          )}
          {p.caste_id && (
            <MetaRow
              icon="people"
              label={t('caste')}
              value={meta.data?.castes.find((c) => c.id === p.caste_id)?.name_en ?? `Caste #${p.caste_id}`}
            />
          )}
          {p.diet && <MetaRow icon="restaurant" label={t('metaDiet')} value={p.diet} />}
          {p.family_values && <MetaRow icon="people" label={t('metaFamilyValues')} value={p.family_values} />}
          {p.manglik_status && p.manglik_status !== 'no' && (
            <MetaRow icon="moon" label={t('metaManglik')} value={p.manglik_status} />
          )}
        </View>

        {p.about_me ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>{t('metaAbout')}</Text>
            <Text style={[styles.aboutText, { color: colors.ink }]}>{p.about_me}</Text>
          </View>
        ) : null}

        {!isOwnProfile && user && (
          <MatchPanel
            profile={p}
            myProfiles={myProfiles.data ?? []}
            matchProfileId={matchProfileId}
            setMatchProfileId={setMatchProfileId}
            matchResult={matchResult}
            matchLoading={matchLoading}
            matchError={matchError}
            onCalculate={calculateMatch}
          />
        )}

        {!isOwnProfile && (
          <View style={styles.actions}>
            {interestStatus === 'pending' ? (
              <View style={styles.pendingRow}>
                <Ionicons name="time-outline" size={18} color={colors.inkFaint} />
                <Button title={t('interestSent')} variant="secondary" disabled size="md" />
              </View>
            ) : interestStatus === 'accepted' ? (
              <Button title={t('openChat')} variant="primary" size="md" leftIcon="chatbubble" disabled />
            ) : (
              <View style={styles.interestRow}>
                <TextInput
                  style={[
                    styles.interestInput,
                    { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface },
                  ]}
                  placeholder={t('customMessagePlaceholder')}
                  placeholderTextColor={colors.inkFaint}
                  value={interestMsg}
                  onChangeText={setInterestMsg}
                  maxLength={200}
                />
                <Button title={t('sendInterest')} size="sm" loading={sending} onPress={sendInterest} />
              </View>
            )}
            <Button
              title={isShortlisted ? t('unshortlist') : t('shortlist')}
              variant={isShortlisted ? 'secondary' : 'outline'}
              size="md"
              leftIcon={isShortlisted ? 'star' : 'star-outline'}
              loading={shortlisting}
              onPress={toggleShortlist}
            />
          </View>
        )}

        {isOwnProfile && (
          <View style={styles.actions}>
            <Button
              title={t('editPhoto')}
              variant="outline"
              size="md"
              leftIcon="camera-outline"
              loading={uploading}
              onPress={uploadPhoto}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function MatchPanel({
  profile,
  myProfiles,
  matchProfileId,
  setMatchProfileId,
  matchResult,
  matchLoading,
  matchError,
  onCalculate,
}: {
  profile: Profile;
  myProfiles: Profile[];
  matchProfileId: string;
  setMatchProfileId: (id: string) => void;
  matchResult: MatchResult | null;
  matchLoading: boolean;
  matchError: string | null;
  onCalculate: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (myProfiles.length === 0) return null;

  const effectiveId = matchProfileId || String(myProfiles[0].id);
  const score = matchResult?.score ?? 0;
  const scoreColor = score >= 7 ? colors.success : score >= 5 ? colors.warning : colors.error;
  const statusLabel = score >= 7 ? t('matchExcellent') : score >= 5 ? t('matchGood') : t('matchLow');

  return (
    <View style={[styles.matchCard, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
      <View style={styles.matchHeader}>
        <Ionicons name="sparkles" size={20} color={colors.primary} />
        <Text style={[styles.matchTitle, { color: colors.ink }]}>{t('matchPanelTitle')}</Text>
      </View>

      <Text style={[styles.matchHint, { color: colors.inkSoft }]}>{t('matchSelectYourProfile')}</Text>

      <View style={styles.matchChips}>
        {myProfiles.map((mine) => {
          const active = String(mine.id) === effectiveId;
          return (
            <Pressable
              key={mine.id}
              onPress={() => setMatchProfileId(String(mine.id))}
              style={[
                styles.matchChip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[styles.matchChipText, { color: active ? colors.white : colors.inkSoft }]}
                numberOfLines={1}
              >
                {mine.name}
              </Text>
              <Text style={[styles.matchChipSub, { color: active ? colors.white : colors.inkFaint }]}>
                {mine.gender === 'M' ? t('lookingForGroom') : t('lookingForBride')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        title={t('matchCalculate')}
        size="md"
        variant="primary"
        loading={matchLoading}
        onPress={onCalculate}
      />

      {matchError && <Text style={[styles.matchError, { color: colors.error }]}>{matchError}</Text>}

      {matchResult && (
        <View style={styles.matchResult}>
          <View style={[styles.scoreDial, { borderColor: scoreColor, shadowColor: scoreColor }]}>
            <Text style={[styles.scoreValue, { color: colors.ink }]}>{score}</Text>
            <Text style={[styles.scoreLabel, { color: colors.inkFaint }]}>{t('matchOf10')}</Text>
          </View>
          <Text style={[styles.statusLabel, { color: scoreColor }]}>{statusLabel}</Text>

          <View style={styles.matchGrid}>
            {Object.entries(matchResult.details).map(([key, val]) => (
              <View
                key={key}
                style={[
                  styles.matchItem,
                  {
                    backgroundColor: val.matched ? colors.successSoft : colors.errorSoft,
                    borderColor: val.matched ? colors.success : colors.error,
                  },
                ]}
              >
                <View style={styles.matchItemHeader}>
                  <Text style={styles.matchItemIcon}>{val.matched ? '✓' : '✕'}</Text>
                  <Text style={[styles.matchItemTitle, { color: colors.ink }]}>{displayName(key)}</Text>
                </View>
                <Text style={[styles.matchItemDesc, { color: colors.inkSoft }]}>{val.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={metaStyles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.inkSoft} />
      <Text style={[metaStyles.label, { color: colors.inkSoft }]}>{label}</Text>
      <Text style={[metaStyles.value, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  label: {
    ...typography.caption,
    minWidth: 100,
  },
  value: {
    ...typography.body,
    flex: 1,
  },
});

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
  },
  photoWrap: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  photo: {
    width: '100%',
    height: 320,
    borderRadius: radius.lg,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.display,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    ...typography.label,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  heightChipText: {
    ...typography.label,
    fontWeight: '700',
  },
  heightToggle: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    gap: 2,
  },
  heightToggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  heightToggleText: {
    ...typography.label,
    fontWeight: '700',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  editProfileText: {
    ...typography.label,
    fontWeight: '700',
  },
  metaGrid: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  aboutText: {
    ...typography.body,
    lineHeight: 22,
  },
  matchCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  matchTitle: {
    ...typography.title,
    flexShrink: 1,
  },
  matchHint: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  matchChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  matchChipText: {
    ...typography.label,
    fontWeight: '700',
  },
  matchChipSub: {
    ...typography.label,
  },
  matchError: {
    ...typography.caption,
    marginTop: spacing.md,
  },
  matchResult: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  scoreDial: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  scoreValue: {
    ...typography.display,
    fontSize: 42,
    lineHeight: 46,
  },
  scoreLabel: {
    ...typography.label,
    marginTop: -2,
  },
  statusLabel: {
    ...typography.body,
    fontWeight: '700',
    marginVertical: spacing.sm,
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  matchItem: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  matchItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  matchItemIcon: {
    fontWeight: '700',
    fontSize: 12,
  },
  matchItemTitle: {
    ...typography.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  matchItemDesc: {
    ...typography.caption,
    lineHeight: 15,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  interestRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  interestInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.body.fontSize,
  },
});