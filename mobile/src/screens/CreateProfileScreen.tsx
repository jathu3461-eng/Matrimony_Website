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
import {
  validateName,
  validateDob,
  validateHeightFeet,
  validateHeightInches,
  validateLongText,
  validateAboutMe,
  fieldError,
  HINTS,
} from '@/utils/validation';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreateProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
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
      name: fieldError(name, touched.name, validateName),
      dob: fieldError(dob, touched.dob, validateDob),
      heightFeet: fieldError(heightFeet, touched.heightFeet, validateHeightFeet),
      heightInches: fieldError(heightInches, touched.heightInches, validateHeightInches),
      education: fieldError(education, touched.education, (v) =>
        validateLongText(v, 'Education')
      ),
      occupation: fieldError(occupation, touched.occupation, (v) =>
        validateLongText(v, 'Occupation')
      ),
      about: fieldError(about, touched.about, validateAboutMe),
      city: fieldError(city, touched.city, (v) =>
        v.length < 2 ? 'Enter at least 2 characters' : null
      ),
    }),
    [name, dob, heightFeet, heightInches, education, occupation, about, city, touched]
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
    setTouched({
      name: true,
      dob: true,
      heightFeet: true,
      heightInches: true,
      education: true,
      occupation: true,
      about: true,
      city: true,
    });
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.ink }]}>Create your profile</Text>
            <Text style={[styles.subtitle, { color: colors.inkFaint }]}>
              Fill in your details to find the right match
            </Text>
          </View>

          <Button
            title={photoUri ? 'Change photo' : 'Add profile photo'}
            variant="outline"
            size="md"
            onPress={pickPhoto}
            leftIcon="camera-outline"
          />
          {photoUri && (
            <Text style={[styles.photoHint, { color: colors.success }]}>Photo selected</Text>
          )}

          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>Basic info</Text>
          <FormField
            label="Full name"
            value={name}
            onChangeText={setName}
            onBlur={() => touch('name')}
            placeholder="Your name"
            maxLength={60}
            count
            error={errors.name}
            hint={HINTS.name}
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
            maxLength={10}
            count
            error={errors.dob}
            hint={HINTS.dob}
          />

          <View style={styles.heightRow}>
            <FormField
              label="Feet"
              value={heightFeet}
              onChangeText={setHeightFeet}
              onBlur={() => touch('heightFeet')}
              keyboardType="number-pad"
              containerStyle={styles.heightInput}
              placeholder="5"
              error={errors.heightFeet}
              hint={HINTS.heightFeet}
            />
            <FormField
              label="Inches"
              value={heightInches}
              onChangeText={setHeightInches}
              onBlur={() => touch('heightInches')}
              keyboardType="number-pad"
              containerStyle={styles.heightInput}
              placeholder="6"
              error={errors.heightInches}
              hint={HINTS.heightInches}
            />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>
            Education & career
          </Text>
          <FormField
            label="Education"
            value={education}
            onChangeText={setEducation}
            onBlur={() => touch('education')}
            placeholder="B.E. Computer Science"
            error={errors.education}
            hint={HINTS.education}
          />
          <FormField
            label="Occupation"
            value={occupation}
            onChangeText={setOccupation}
            onBlur={() => touch('occupation')}
            placeholder="Software Engineer"
            error={errors.occupation}
            hint={HINTS.occupation}
          />
          <FormField
            label="City / State"
            value={city}
            onChangeText={setCity}
            onBlur={() => touch('city')}
            placeholder="Chennai"
            error={errors.city}
            hint={HINTS.city}
          />

          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>Lifestyle</Text>
          <FormField
            label="Diet"
            value={diet}
            onChangeText={setDiet}
            placeholder="Vegetarian"
            hint={HINTS.diet}
          />
          <FormField
            label="Family values"
            value={familyValues}
            onChangeText={setFamilyValues}
            placeholder="Traditional"
            hint={HINTS.familyValues}
          />

          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>About you</Text>
          <FormField
            label="About me"
            value={about}
            onChangeText={setAbout}
            onBlur={() => touch('about')}
            placeholder="Tell others about yourself..."
            multiline
            style={{ minHeight: 80, textAlignVertical: 'top' }}
            maxLength={2000}
            count
            error={errors.about}
            hint={HINTS.aboutMe}
          />

          {serverError && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
              <Text style={[styles.errorBoxText, { color: colors.error }]}>{serverError}</Text>
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
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  photoHint: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
  },
});
