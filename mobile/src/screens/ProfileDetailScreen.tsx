import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
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
import type { Profile } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type DetailRoute = RouteProp<RootStackParamList, 'ProfileDetail'>;

export function ProfileDetailScreen() {
  const route = useRoute<DetailRoute>();
  const { profileId } = route.params;
  const user = useAppSelector((s) => s.auth.user);
  const { colors } = useTheme();

  const [interestMsg, setInterestMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      Alert.alert('Photo updated');
      profile.refetch();
    } catch (err) {
      Alert.alert('Error', extractError(err, 'Failed to upload photo.'));
    } finally {
      setUploading(false);
    }
  };

  if (profile.isLoading) return <Spinner />;
  if (profile.isError || !p)
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={48} color={colors.inkFaint} />
          <Text style={[styles.emptyText, { color: colors.inkFaint }]}>Profile not found.</Text>
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
              <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
            </View>
          )}
        </View>

        <Text style={[styles.subtitle, { color: colors.inkSoft }]}>
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
            <MetaRow icon="book" label="Religion" value={String(p.religion_id)} />
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
            <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>About</Text>
            <Text style={[styles.aboutText, { color: colors.ink }]}>{p.about_me}</Text>
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
              <Button title="Start Chat" variant="primary" size="md" leftIcon="chatbubble" disabled />
            ) : (
              <View style={styles.interestRow}>
                <TextInput
                  style={[
                    styles.interestInput,
                    { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface },
                  ]}
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
            <Button
              title="Edit Photo"
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
    shadowColor: colors.black,
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
    marginBottom: spacing.sm,
  },
  aboutText: {
    ...typography.body,
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
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.body.fontSize,
  },
});
