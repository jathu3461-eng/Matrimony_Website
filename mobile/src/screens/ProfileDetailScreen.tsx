import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '@/api/profiles';
import { interestApi } from '@/api/interests';
import { uploadsUrl, extractError } from '@/api/client';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { Screen } from '@/components/Screen';
import { useAppSelector } from '@/store/hooks';
import { colors, radius, spacing, typography } from '@/theme';
import type { Profile } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type DetailRoute = RouteProp<RootStackParamList, 'ProfileDetail'>;

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ProfileDetailScreen() {
  const route = useRoute<DetailRoute>();
  const { profileId } = route.params;
  const user = useAppSelector((s) => s.auth.user);

  const [interestMsg, setInterestMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);

  const profile = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => profileApi.getById(profileId),
  });

  const p = profile.data;

  const sendInterest = async () => {
    if (!p) return;
    setSending(true);
    try {
      await interestApi.send(p.id, interestMsg.trim() || undefined);
      setInterestMsg('');
      Alert.alert('Interest sent', 'Your interest has been sent successfully.');
      profile.refetch();
    } catch (err) {
      Alert.alert('Error', extractError(err, 'Failed to send interest.'));
    } finally {
      setSending(false);
    }
  };

  const toggleShortlist = async () => {
    if (!p) return;
    setShortlisting(true);
    try {
      const shortlisted = await interestApi.toggleShortlist(p.id);
      Alert.alert(shortlisted ? 'Added to shortlist' : 'Removed from shortlist');
      profile.refetch();
    } catch {
      Alert.alert('Error', 'Could not update shortlist.');
    } finally {
      setShortlisting(false);
    }
  };

  if (profile.isLoading) return <Spinner />;
  if (profile.isError || !p)
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Profile not found.</Text>
        </View>
      </Screen>
    );

  const photoUrl = uploadsUrl(p.main_profile_picture);
  const isOwnProfile = user?.id === p.owner_user_id;
  const isShortlisted = p.is_shortlisted === 1;
  const interestStatus = p.interest_status;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="person" size={64} color={colors.inkFaint} />
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.name}>{p.name}</Text>
          {p.is_verified === 1 && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <Text style={styles.subtitle}>
          {p.age} yrs · {p.height_feet}'{p.height_inches ?? 0}" · {p.gender === 'M' ? 'Male' : 'Female'}
        </Text>

        <View style={styles.metaGrid}>
          {p.occupation && (
            <MetaRow icon="briefcase" label="Occupation" value={p.occupation} />
          )}
          {p.education && (
            <MetaRow icon="school" label="Education" value={p.education} />
          )}
          {p.city_or_state && (
            <MetaRow icon="location" label="Location" value={p.city_or_state} />
          )}
          {p.religion_id && (
            <MetaRow icon="book" label="Religion" value={`#${p.religion_id}`} />
          )}
          {p.diet && (
            <MetaRow icon="restaurant" label="Diet" value={p.diet} />
          )}
          {p.family_values && (
            <MetaRow icon="people" label="Family values" value={p.family_values} />
          )}
          {p.manglik_status && p.manglik_status !== 'no' && (
            <MetaRow icon="moon" label="Manglik" value={p.manglik_status} />
          )}
        </View>

        {p.about_me ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{p.about_me}</Text>
          </View>
        ) : null}

        {!isOwnProfile && (
          <View style={styles.actions}>
            {interestStatus === 'pending' ? (
              <View style={styles.pendingRow}>
                <Ionicons name="time-outline" size={18} color={colors.inkFaint} />
                <Button title="Interest Sent" variant="secondary" disabled size="md" />
              </View>
            ) : interestStatus === 'accepted' ? (
              <Button title="Chat" variant="primary" size="md" disabled leftIcon="chatbubble" />
            ) : (
              <View style={styles.interestRow}>
                <TextInput
                  style={styles.interestInput}
                  placeholder="Add a personal message..."
                  placeholderTextColor={colors.inkFaint}
                  value={interestMsg}
                  onChangeText={setInterestMsg}
                  maxLength={200}
                />
                <Button title="Send" size="sm" loading={sending} onPress={sendInterest} />
              </View>
            )}
            <Button
              title={isShortlisted ? 'Unshortlist' : 'Shortlist'}
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
            <Text style={styles.ownLabel}>This is your own profile</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={metaStyles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.inkSoft} />
      <Text style={metaStyles.label}>{label}</Text>
      <Text style={metaStyles.value}>{value}</Text>
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
    color: colors.inkSoft,
    minWidth: 100,
  },
  value: {
    ...typography.body,
    color: colors.ink,
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
  },
  emptyText: {
    ...typography.body,
    color: colors.inkFaint,
  },
  photo: {
    width: '100%',
    height: 320,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.lg,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.display,
    color: colors.ink,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    ...typography.label,
    color: colors.success,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSoft,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
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
    color: colors.inkFaint,
    marginBottom: spacing.sm,
  },
  aboutText: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 22,
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
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.body.fontSize,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  ownLabel: {
    ...typography.caption,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
