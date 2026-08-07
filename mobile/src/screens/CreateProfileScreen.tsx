import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { profileApi } from '@/api/profiles';
import { extractError } from '@/api/client';
import { colors, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

export function CreateProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [dob, setDob] = useState('');
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('6');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [diet, setDiet] = useState('');
  const [familyValues, setFamilyValues] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched((t) => ({ ...t, [f]: true }));

  const errors = useMemo(
    () => ({
      name: touched.name ? (!name.trim() ? 'Full name is required' : null) : null,
      dob: touched.dob
        ? !dob.trim()
          ? 'Date of birth is required'
          : !DOB_RE.test(dob.trim())
            ? 'Use format YYYY-MM-DD (e.g. 1995-06-15)'
            : null
        : null,
      occupation: touched.occupation
        ? !occupation.trim()
          ? 'Occupation is required'
          : null
        : null,
      education: touched.education
        ? education.trim().length > 0 && education.trim().length < 3
          ? 'Enter a valid education level'
          : null
        : null,
      city: touched.city
        ? city.trim().length > 0 && city.trim().length < 2
          ? 'Enter a valid city'
          : null
        : null,
    }),
    [name, dob, occupation, education, city, touched]
  );

  const hasErrors = Object.values(errors).some(Boolean);

  const pickPhoto = async () => {
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

  const submit = async () => {
    setTouched({ name: true, dob: true, occupation: true });
    if (hasErrors) return;

    setServerError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('gender', gender);
      formData.append('date_of_birth', dob.trim());
      formData.append('height_feet', heightFeet);
      formData.append('height_inches', heightInches);
      formData.append('education', education.trim());
      formData.append('occupation', occupation.trim());
      formData.append('about_me', about.trim());
      formData.append('city_or_state', city.trim());
      formData.append('diet', diet.trim());
      formData.append('family_values', familyValues.trim());
      formData.append('profile_registered_for', 'self');
      if (photoUri) {
        const ext = photoUri.split('.').pop() || 'jpg';
        formData.append('main_profile_picture', {
          uri: photoUri,
          name: `profile.${ext}`,
          type: `image/${ext}`,
        } as unknown as Blob);
      }
      await profileApi.create(formData);
      Alert.alert('Profile created', 'Your profile is now live.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setServerError(extractError(err, 'Failed to create profile.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create your profile</Text>
            <Text style={styles.subtitle}>Fill in your details to find the right match</Text>
          </View>

          <Button
            title={photoUri ? 'Change photo' : 'Add profile photo'}
            variant="outline"
            size="md"
            onPress={pickPhoto}
            leftIcon="camera-outline"
          />
          {photoUri && <Text style={styles.photoHint}>Photo selected</Text>}

          <Text style={styles.sectionLabel}>Basic info</Text>
          <FormField
            label="Full name"
            value={name}
            onChangeText={setName}
            onBlur={() => touch('name')}
            placeholder="Your name"
            error={errors.name}
            hint="Your display name on the profile"
          />

          <View style={styles.genderRow}>
            <Button
              title="Male"
              variant={gender === 'M' ? 'primary' : 'outline'}
              size="sm"
              style={styles.genderBtn}
              onPress={() => setGender('M')}
            />
            <Button
              title="Female"
              variant={gender === 'F' ? 'primary' : 'outline'}
              size="sm"
              style={styles.genderBtn}
              onPress={() => setGender('F')}
            />
          </View>

          <FormField
            label="Date of birth"
            value={dob}
            onChangeText={setDob}
            onBlur={() => touch('dob')}
            placeholder="YYYY-MM-DD (e.g. 1995-06-15)"
            keyboardType="numbers-and-punctuation"
            error={errors.dob}
            hint="Format: YYYY-MM-DD"
          />

          <View style={styles.heightRow}>
            <FormField
              label="Feet"
              value={heightFeet}
              onChangeText={setHeightFeet}
              keyboardType="number-pad"
              containerStyle={styles.heightInput}
              placeholder="5"
            />
            <FormField
              label="Inches"
              value={heightInches}
              onChangeText={setHeightInches}
              keyboardType="number-pad"
              containerStyle={styles.heightInput}
              placeholder="6"
            />
          </View>

          <Text style={styles.sectionLabel}>Education & career</Text>
          <FormField
            label="Education"
            value={education}
            onChangeText={setEducation}
            onBlur={() => touch('education')}
            placeholder="B.E. Computer Science"
            error={errors.education}
            hint="Degree or qualification"
          />
          <FormField
            label="Occupation"
            value={occupation}
            onChangeText={setOccupation}
            onBlur={() => touch('occupation')}
            placeholder="Software Engineer"
            error={errors.occupation}
            hint="Your current job title"
          />
          <FormField
            label="City / State"
            value={city}
            onChangeText={setCity}
            onBlur={() => touch('city')}
            placeholder="Chennai"
            error={errors.city}
            hint="Where you live"
          />

          <Text style={styles.sectionLabel}>Lifestyle</Text>
          <FormField
            label="Diet"
            value={diet}
            onChangeText={setDiet}
            placeholder="Vegetarian"
            hint="e.g. Vegetarian, Non-vegetarian, Vegan"
          />
          <FormField
            label="Family values"
            value={familyValues}
            onChangeText={setFamilyValues}
            placeholder="Traditional"
            hint="e.g. Traditional, Moderate, Liberal"
          />

          <Text style={styles.sectionLabel}>About you</Text>
          <FormField
            label="About me"
            value={about}
            onChangeText={setAbout}
            placeholder="Tell others about yourself..."
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          {serverError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{serverError}</Text>
            </View>
          )}

          <Button title="Create Profile" onPress={submit} loading={loading} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.caption,
    color: colors.inkFaint,
    marginTop: spacing.xs,
  },
  photoHint: {
    ...typography.caption,
    color: colors.success,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.inkFaint,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genderBtn: {
    flex: 1,
  },
  heightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heightInput: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: colors.errorSoft,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
    color: colors.error,
  },
});
