import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, RouteProp, useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { radius, spacing, typography, layout } from '@/theme';
import type { Profile, ProfileMeta } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type DetailRoute = RouteProp<RootStackParamList, 'ProfileDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { profileId } = route.params;
  const user = useAppSelector((s) => s.auth.user);
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [interestMsg, setInterestMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [horoscopeVisible, setHoroscopeVisible] = useState(false);

  const profile = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => profileApi.getById(profileId),
  });

  const myProfiles = useQuery({
    queryKey: ['my-profiles'],
    queryFn: () => profileApi.mine(),
  });

  const meta = useQuery({
    queryKey: ['meta'],
    queryFn: () => profileApi.getMeta(),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) =>
      interestApi.respond(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });

  const p = profile.data;
  const metaData = meta.data as ProfileMeta | undefined;

  const resolveName = (
    list: Array<{ id: number; name_en: string }> | undefined,
    id: number | null | undefined,
  ) => {
    if (!id || !list) return null;
    return list.find((r) => r.id === id)?.name_en ?? null;
  };

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

  const uploadPhoto = async (useCamera?: boolean) => {
    if (!p) return;
    const permResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permResult.status !== 'granted') {
      Alert.alert('Permission needed', useCamera
        ? 'Please allow camera access to take a photo.'
        : 'Please allow photo library access to change your profile picture.');
      return;
    }
    const res = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_registered_for', p.profile_registered_for || 'Self');
      formData.append('name', p.name || '');
      formData.append('gender', p.gender || 'M');
      formData.append('date_of_birth', p.date_of_birth || '');
      formData.append('height_feet', String(p.height_feet ?? 5));
      formData.append('height_inches', String(p.height_inches ?? 6));
      formData.append('education', p.education || '');
      formData.append('occupation', p.occupation || '');
      if (p.religion_id) formData.append('religion_id', String(p.religion_id));
      if (p.caste_id) formData.append('caste_id', String(p.caste_id));
      if (p.sub_religion) formData.append('sub_religion', p.sub_religion);
      if (p.raasi_id) formData.append('raasi_id', String(p.raasi_id));
      if (p.star_id) formData.append('star_id', String(p.star_id));
      if (p.born_country_id) formData.append('born_country_id', p.born_country_id);
      if (p.current_country_id) formData.append('current_country_id', p.current_country_id);
      if (p.city_or_state) formData.append('city_or_state', p.city_or_state);
      formData.append('about_me', p.about_me || '');
      formData.append('diet', p.diet || 'any');
      formData.append('family_values', p.family_values || 'moderate');
      formData.append('career_goals', p.career_goals || 'working');
      formData.append('willing_to_relocate', p.willing_to_relocate || 'open');
      formData.append('income_range', p.income_range || '');
      formData.append('manglik_status', p.manglik_status || 'no');
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

  const showPhotoOptions = () => {
    Alert.alert('Change Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => uploadPhoto(true) },
      { text: 'Choose from Library', onPress: () => uploadPhoto(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (profile.isLoading) return <Spinner />;
  if (profile.isError || !p)
    return (
      <Screen edges={['bottom']}>
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
  const myProfileId = myProfiles.data?.[0]?.id;

  return (
    <Screen edges={['bottom']}>
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
              onPress={showPhotoOptions}
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
            <MetaRow icon="book" label="Religion" value={resolveName(metaData?.religions, p.religion_id) ?? String(p.religion_id)} />
          )}
          {p.caste_id && (
            <MetaRow icon="people" label="Caste" value={resolveName(metaData?.castes, p.caste_id) ?? String(p.caste_id)} />
          )}
          {p.diet && p.diet !== 'any' && (
            <MetaRow icon="restaurant" label="Diet" value={p.diet.replace('_', ' ')} />
          )}
          {p.family_values && (
            <MetaRow icon="people" label="Family values" value={p.family_values} />
          )}
          {p.income_range && (
            <MetaRow icon="cash" label="Income" value={p.income_range} />
          )}
          {p.manglik_status && p.manglik_status !== 'no' && (
            <MetaRow icon="moon" label="Manglik" value={p.manglik_status === 'dont_know' ? "Don't know" : p.manglik_status} />
          )}
        </View>

        {p.about_me ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>About</Text>
            <Text style={[styles.aboutText, { color: colors.ink }]}>{p.about_me}</Text>
          </View>
        ) : null}

        {p.horoscope_chart && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>Horoscope</Text>
            <Pressable
              onPress={() => setHoroscopeVisible(true)}
              style={[styles.horoscopeBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            >
              <Ionicons name="eye" size={18} color={colors.primary} />
              <Text style={[styles.horoscopeBtnText, { color: colors.primary }]}>View Horoscope Chart</Text>
            </Pressable>
          </View>
        )}

        <Modal visible={horoscopeVisible} transparent animationType="fade" onRequestClose={() => setHoroscopeVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setHoroscopeVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Pressable onPress={() => setHoroscopeVisible(false)} style={styles.modalClose}>
                <Ionicons name="close-circle" size={28} color={colors.inkFaint} />
              </Pressable>
              {uploadsUrl(p.horoscope_chart) ? (
                <Image source={{ uri: uploadsUrl(p.horoscope_chart)! }} style={styles.modalImage} resizeMode="contain" />
              ) : (
                <Text style={{ color: colors.inkFaint }}>Horoscope not available</Text>
              )}
            </View>
          </Pressable>
        </Modal>

        {!isOwnProfile && (
          <View style={styles.actions}>
            {p.interest_direction === 'received' && p.interest_status === 'pending' ? (
              <View style={styles.respondRow}>
                <Text style={[styles.respondLabel, { color: colors.ink }]}>This person sent you an interest</Text>
                <View style={styles.respondActions}>
                  <Button
                    title="Accept"
                    variant="primary"
                    size="md"
                    leftIcon="checkmark"
                    loading={respondMutation.isPending}
                    onPress={() => respondMutation.mutate({ id: p.interest_id!, status: 'accepted' })}
                  />
                  <Button
                    title="Decline"
                    variant="secondary"
                    size="md"
                    leftIcon="close"
                    loading={respondMutation.isPending}
                    onPress={() => respondMutation.mutate({ id: p.interest_id!, status: 'rejected' })}
                  />
                </View>
              </View>
            ) : interestStatus === 'pending' ? (
              <View style={styles.pendingRow}>
                <Ionicons name="time-outline" size={18} color={colors.inkFaint} />
                <Button title="Interest Sent" variant="secondary" disabled size="md" />
              </View>
            ) : interestStatus === 'accepted' ? (
              <Button
                title="Start Chat"
                variant="primary"
                size="md"
                leftIcon="chatbubble"
                disabled={!myProfileId}
                onPress={() => {
                  if (!myProfileId) return;
                  navigation.navigate('ChatThread', {
                    profileA: myProfileId,
                    profileB: p.id,
                    otherName: p.name,
                  });
                }}
              />
            ) : (
              <View style={styles.interestRow}>
                <TextInput
                  style={[styles.interestInput, { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface }]}
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
              title="Edit Profile"
              variant="primary"
              size="md"
              leftIcon="create-outline"
              onPress={() => navigation.navigate('EditProfile', { profileId: p.id })}
            />
            <Button
              title="Edit Photo"
              variant="outline"
              size="md"
              leftIcon="camera-outline"
              loading={uploading}
              onPress={showPhotoOptions}
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
    paddingBottom: layout.bottomContentInset,
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
  respondRow: {
    gap: spacing.sm,
  },
  respondLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  respondActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  horoscopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  horoscopeBtnText: {
    ...typography.body,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: radius.md,
  },
});
