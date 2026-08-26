import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/api/profiles';
import { uploadsUrl, extractError } from '@/api/client';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { SelectField } from '@/components/SelectField';
import { Spinner } from '@/components/Spinner';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import {
  POSTED_BY,
  DIET_OPTIONS,
  FAMILY_VALUES,
  CAREER_GOALS,
  RELOCATE,
  INCOME_RANGE,
  MANGLIK,
} from '@/utils/validation';
import type { ProfileMeta, Profile } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Route = RouteProp<RootStackParamList, 'EditProfile'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function EditProfileScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { profileId } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => profileApi.getById(profileId),
  });

  const meta = useQuery({
    queryKey: ['meta'],
    queryFn: () => profileApi.getMeta(),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const p = profile.data;
  const metaData = meta.data as ProfileMeta | undefined;

  useEffect(() => {
    if (!p) return;
    setForm({
      profile_registered_for: p.profile_registered_for || 'Self',
      name: p.name || '',
      gender: p.gender || 'M',
      date_of_birth: p.date_of_birth || '',
      height_feet: String(p.height_feet ?? 5),
      height_inches: String(p.height_inches ?? 6),
      education: p.education || '',
      occupation: p.occupation || '',
      religion_id: String(p.religion_id ?? ''),
      caste_id: String(p.caste_id ?? ''),
      sub_religion: p.sub_religion || '',
      raasi_id: String(p.raasi_id ?? ''),
      star_id: String(p.star_id ?? ''),
      born_country_id: p.born_country_id || '',
      current_country_id: p.current_country_id || '',
      city_or_state: p.city_or_state || '',
      about_me: p.about_me || '',
      diet: p.diet || 'any',
      family_values: p.family_values || 'moderate',
      career_goals: p.career_goals || 'working',
      willing_to_relocate: p.willing_to_relocate || 'open',
      income_range: p.income_range || '$50k - $100k',
      manglik_status: p.manglik_status || 'no',
      blur_photo: String(p.blur_photo ?? 0),
      blur_horoscope: String(p.blur_horoscope ?? 0),
    });
  }, [p]);

  const set = useCallback(
    (field: string) => (value: string) =>
      setForm((f) => ({ ...f, [field]: value })),
    [],
  );

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Change Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const save = async () => {
    if (!p) return;
    if (!form.name?.trim() || form.name.trim().length < 2) {
      Alert.alert('Validation', 'Name must be at least 2 characters.');
      return;
    }
    if (!form.education?.trim()) {
      Alert.alert('Validation', 'Education is required.');
      return;
    }
    if (!form.occupation?.trim()) {
      Alert.alert('Validation', 'Occupation is required.');
      return;
    }
    if (!form.about_me?.trim() || form.about_me.trim().length < 50) {
      Alert.alert('Validation', 'About me must be at least 50 characters.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v ?? '')));
      if (photoUri) {
        const ext = photoUri.split('.').pop() || 'jpg';
        formData.append('main_profile_picture', {
          uri: photoUri,
          name: `profile.${ext}`,
          type: `image/${ext}`,
        } as unknown as Blob);
      }
      await profileApi.update(p.id, formData);
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['my-profiles'] });
      Alert.alert('Profile updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', extractError(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (profile.isLoading || !p) return <Spinner />;
  if (profile.isError) {
    return (
      <Screen edges={['bottom']}>
        <View style={styles.center}>
          <Text style={{ color: colors.inkFaint }}>Profile not found.</Text>
        </View>
      </Screen>
    );
  }

  const photoUrl = photoUri || uploadsUrl(p.main_profile_picture);

  return (
    <Screen edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo section */}
          <View style={styles.photoSection}>
            <Pressable onPress={showPhotoOptions} style={styles.photoWrap}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="person" size={48} color={colors.inkFaint} />
                </View>
              )}
              <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={18} color={colors.white} />
              </View>
            </Pressable>
            <Pressable onPress={showPhotoOptions}>
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
            </Pressable>
          </View>

          {/* Personal Info */}
          <SectionHeader icon="person" title="Personal Information" colors={colors} />

          <SelectField
            label="Profile Posted By"
            options={POSTED_BY.map((p) => ({ value: p, label: p }))}
            value={form.profile_registered_for}
            onChange={set('profile_registered_for')}
          />

          <FormField
            label="Full Name"
            value={form.name}
            onChangeText={set('name')}
            placeholder="Your full name"
            maxLength={60}
          />

          <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>Gender</Text>
          <View style={styles.genderRow}>
            <Pressable
              onPress={() => setForm((f) => ({ ...f, gender: 'M' }))}
              style={[
                styles.genderBtn,
                {
                  borderColor: form.gender === 'M' ? colors.primary : colors.borderStrong,
                  backgroundColor: form.gender === 'M' ? colors.primary : colors.surface,
                },
              ]}
            >
              <Ionicons name="person" size={16} color={form.gender === 'M' ? colors.white : colors.inkSoft} />
              <Text style={[styles.genderBtnText, { color: form.gender === 'M' ? colors.white : colors.inkSoft }]}>
                Groom
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setForm((f) => ({ ...f, gender: 'F' }))}
              style={[
                styles.genderBtn,
                {
                  borderColor: form.gender === 'F' ? colors.primary : colors.borderStrong,
                  backgroundColor: form.gender === 'F' ? colors.primary : colors.surface,
                },
              ]}
            >
              <Ionicons name="people" size={16} color={form.gender === 'F' ? colors.white : colors.inkSoft} />
              <Text style={[styles.genderBtnText, { color: form.gender === 'F' ? colors.white : colors.inkSoft }]}>
                Bride
              </Text>
            </Pressable>
          </View>

          <FormField
            label="Date of Birth"
            value={form.date_of_birth}
            onChangeText={set('date_of_birth')}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          {/* Height */}
          <SectionHeader icon="resize" title="Height" colors={colors} />
          <View style={styles.heightRow}>
            <SelectField
              label="Feet"
              options={[3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n} ft` }))}
              value={form.height_feet}
              onChange={set('height_feet')}
              containerStyle={styles.halfField}
            />
            <SelectField
              label="Inches"
              options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` }))}
              value={form.height_inches}
              onChange={set('height_inches')}
              containerStyle={styles.halfField}
            />
          </View>

          {/* Education & Career */}
          <SectionHeader icon="school" title="Education & Career" colors={colors} />
          <FormField
            label="Education"
            value={form.education}
            onChangeText={set('education')}
            placeholder="B.E. Computer Science"
            maxLength={200}
          />
          <FormField
            label="Occupation"
            value={form.occupation}
            onChangeText={set('occupation')}
            placeholder="Software Engineer"
            maxLength={200}
          />
          <SelectField
            label="Career Goals"
            options={CAREER_GOALS}
            value={form.career_goals}
            onChange={set('career_goals')}
          />

          {/* Lifestyle */}
          <SectionHeader icon="heart" title="Lifestyle" colors={colors} />
          <SelectField
            label="Diet"
            options={DIET_OPTIONS}
            value={form.diet}
            onChange={set('diet')}
          />
          <SelectField
            label="Family Values"
            options={FAMILY_VALUES}
            value={form.family_values}
            onChange={set('family_values')}
          />
          <SelectField
            label="Relocation"
            options={RELOCATE}
            value={form.willing_to_relocate}
            onChange={set('willing_to_relocate')}
          />
          <SelectField
            label="Income Range"
            options={INCOME_RANGE}
            value={form.income_range}
            onChange={set('income_range')}
          />
          <SelectField
            label="Manglik / Dosham"
            options={MANGLIK}
            value={form.manglik_status}
            onChange={set('manglik_status')}
          />

          {/* Religion & Caste */}
          <SectionHeader icon="library" title="Religion & Caste" colors={colors} />
          <SelectField
            label="Religion"
            options={(metaData?.religions || []).map((r) => ({
              value: String(r.id),
              label: r.name_en,
            }))}
            value={form.religion_id}
            onChange={set('religion_id')}
          />
          <SelectField
            label="Caste"
            options={(metaData?.castes || []).map((c) => ({
              value: String(c.id),
              label: c.name_en,
            }))}
            value={form.caste_id}
            onChange={set('caste_id')}
          />
          <FormField
            label="Sub-Religion / Sect"
            value={form.sub_religion}
            onChangeText={set('sub_religion')}
            placeholder="Optional"
            maxLength={200}
          />

          {/* Astrology */}
          <SectionHeader icon="star" title="Astrology" colors={colors} />
          <View style={styles.heightRow}>
            <SelectField
              label="Raasi / Zodiac"
              options={(metaData?.raasis || []).map((r) => ({
                value: String(r.id),
                label: r.name_en,
              }))}
              value={form.raasi_id}
              onChange={set('raasi_id')}
              containerStyle={styles.halfField}
            />
            <SelectField
              label="Star / Nakshatram"
              options={(metaData?.stars || []).map((s) => ({
                value: String(s.id),
                label: s.name_en,
              }))}
              value={form.star_id}
              onChange={set('star_id')}
              containerStyle={styles.halfField}
            />
          </View>

          {/* Location */}
          <SectionHeader icon="location" title="Location" colors={colors} />
          <SelectField
            label="Country of Birth"
            options={(metaData?.countries || []).map((c) => ({
              value: c.code,
              label: c.name_en,
            }))}
            value={form.born_country_id}
            onChange={set('born_country_id')}
          />
          <SelectField
            label="Current Country"
            options={(metaData?.countries || []).map((c) => ({
              value: c.code,
              label: c.name_en,
            }))}
            value={form.current_country_id}
            onChange={set('current_country_id')}
          />
          <FormField
            label="City or State"
            value={form.city_or_state}
            onChangeText={set('city_or_state')}
            placeholder="Toronto"
            maxLength={100}
          />

          {/* About */}
          <SectionHeader icon="document-text" title="About Me" colors={colors} />
          <FormField
            label="About Me"
            value={form.about_me}
            onChangeText={set('about_me')}
            placeholder="Tell your story (minimum 50 characters)"
            multiline
            maxLength={2000}
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />

          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* Save button */}
        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <Button
            title="Save Changes"
            variant="primary"
            size="md"
            onPress={save}
            loading={saving}
            leftIcon="checkmark-circle"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SectionHeader({ icon, title, colors }: { icon: string; title: string; colors: any }) {
  return (
    <View style={[sectionStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[sectionStyles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.primary} />
      </View>
      <Text style={[sectionStyles.title, { color: colors.ink }]}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 16,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 160,
    borderRadius: radius.lg,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
