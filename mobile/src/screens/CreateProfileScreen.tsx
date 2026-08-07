import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { profileApi } from '@/api/profiles';
import { extractError } from '@/api/client';
import { colors, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreateProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

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
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!dob.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
      setError('Enter date of birth as YYYY-MM-DD.');
      return;
    }
    if (!occupation.trim()) {
      setError('Occupation is required.');
      return;
    }
    setError(undefined);
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
      setError(extractError(err, 'Failed to create profile.'));
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your profile</Text>

          <Button
            title={photoUri ? 'Change photo' : 'Add profile photo'}
            variant="outline"
            size="md"
            onPress={pickPhoto}
          />
          {photoUri && (
            <Text style={styles.photoHint}>Photo selected</Text>
          )}

          <Text style={styles.sectionLabel}>Basic info</Text>
          <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" />

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

          <Input
            label="Date of birth (YYYY-MM-DD)"
            value={dob}
            onChangeText={setDob}
            placeholder="1995-06-15"
            keyboardType="numbers-and-punctuation"
          />
          <View style={styles.heightRow}>
            <Input
              label="Feet"
              value={heightFeet}
              onChangeText={setHeightFeet}
              keyboardType="number-pad"
              containerStyle={styles.heightInput}
            />
            <Input
              label="Inches"
              value={heightInches}
              onChangeText={setHeightInches}
              keyboardType="number-pad"
              containerStyle={styles.heightInput}
            />
          </View>

          <Text style={styles.sectionLabel}>Education & career</Text>
          <Input label="Education" value={education} onChangeText={setEducation} placeholder="B.E. Computer Science" />
          <Input label="Occupation" value={occupation} onChangeText={setOccupation} placeholder="Software Engineer" />
          <Input label="City / State" value={city} onChangeText={setCity} placeholder="Chennai" />

          <Text style={styles.sectionLabel}>Lifestyle</Text>
          <Input label="Diet" value={diet} onChangeText={setDiet} placeholder="Vegetarian" />
          <Input label="Family values" value={familyValues} onChangeText={setFamilyValues} placeholder="Traditional" />

          <Text style={styles.sectionLabel}>About you</Text>
          <Input
            label="About me"
            value={about}
            onChangeText={setAbout}
            placeholder="Tell others about yourself..."
            multiline
            style={{ minHeight: 80 }}
          />

          {error && <Text style={styles.error}>{error}</Text>}

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
  title: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.lg,
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
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
