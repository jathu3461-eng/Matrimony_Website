import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { SelectField } from '@/components/SelectField';
import { ProgressBar } from '@/components/ProgressBar';
import { StepIndicator } from '@/components/StepIndicator';
import { profileApi } from '@/api/profiles';
import { extractError } from '@/api/client';
import { useTheme } from '@/theme';
import { radius, spacing, typography, layout } from '@/theme';
import {
  EMPTY_FORM,
  POSTED_BY,
  DIET_OPTIONS,
  FAMILY_VALUES,
  CAREER_GOALS,
  RELOCATE,
  INCOME_RANGE,
  MANGLIK,
  profileSteps,
  validateProfileStep,
  type ProfileForm,
} from '@/utils/validation';
import type { ProfileMeta } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreateProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileForm>({ ...EMPTY_FORM });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [horoscopeUri, setHoroscopeUri] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    profileApi.getMeta().then(setMeta).catch(() => {});
  }, []);

  const set = useCallback(
    (field: keyof ProfileForm) => (value: string) =>
      setForm((f) => ({ ...f, [field]: value })),
    [],
  );
  const blur = useCallback(
    (field: string) => () => setTouched((t) => ({ ...t, [field]: true })),
    [],
  );

  const stepErrors = useMemo(
    () => validateProfileStep(step, form),
    [step, form],
  );

  const completion = useMemo(() => {
    let done = 0;
    profileSteps.forEach((_, i) => {
      if (Object.keys(validateProfileStep(i, form)).length === 0) done += 1;
    });
    return Math.round((done / profileSteps.length) * 100);
  }, [form]);

  const validSteps = useMemo(
    () => profileSteps.map((_, i) => Object.keys(validateProfileStep(i, form)).length === 0),
    [form],
  );

  const maxReachable = useMemo(() => {
    let m = 0;
    while (m < profileSteps.length && validSteps[m]) m += 1;
    return m;
  }, [validSteps]);

  const markStepTouched = useCallback(() => {
    const stepFields = profileSteps[step].fields;
    setTouched((t) => ({ ...t, ...Object.fromEntries(stepFields.map((f) => [f, true])) }));
  }, [step]);

  const goNext = useCallback(() => {
    markStepTouched();
    const errs = validateProfileStep(step, form);
    if (Object.keys(errs).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setStep((s) => Math.min(s + 1, profileSteps.length - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step, form, markStepTouched]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const goToStep = useCallback(
    (i: number) => {
      if (i < step) {
        setStep(i);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      if (i <= maxReachable) {
        setStep(i);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    },
    [step, maxReachable],
  );

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

  const pickHoroscope = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setHoroscopeUri(res.assets[0].uri);
    }
  };

  const submit = async () => {
    const allErrors = profileSteps.map((_, i) => validateProfileStep(i, form));
    const firstBad = allErrors.findIndex((e) => Object.keys(e).length > 0);
    if (firstBad !== -1) {
      setStep(firstBad);
      const badFields = profileSteps[firstBad].fields;
      setTouched((t) => ({ ...t, ...Object.fromEntries(badFields.map((f) => [f, true])) }));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setServerError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
      if (photoUri) {
        const ext = photoUri.split('.').pop() || 'jpg';
        formData.append('main_profile_picture', {
          uri: photoUri,
          name: `profile.${ext}`,
          type: `image/${ext}`,
        } as unknown as Blob);
      }
      if (horoscopeUri) {
        const ext = horoscopeUri.split('.').pop() || 'jpg';
        formData.append('horoscope_chart', {
          uri: horoscopeUri,
          name: `horoscope.${ext}`,
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

  // ── Step content renderer ──────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // Step 0: Basics
      case 0:
        return (
          <>
            <SelectField
              label="Profile Posted By"
              options={POSTED_BY.map((p) => ({ value: p, label: p }))}
              value={form.profile_registered_for}
              onChange={set('profile_registered_for')}
              error={touched.profile_registered_for ? stepErrors.profile_registered_for : null}
              required
            />
            <FormField
              label="Full Name"
              value={form.name}
              onChangeText={set('name')}
              onBlur={blur('name')}
              placeholder="Priya Sutharsan"
              maxLength={60}
              count
              error={touched.name ? stepErrors.name : null}
              hint={touched.name ? undefined : 'Min 2 characters, letters and spaces only'}
            />

            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>
              Gender<Text style={{ color: colors.error }}> *</Text>
            </Text>
            <View style={styles.genderRow}>
              <Pressable
                onPress={() => { setForm((f) => ({ ...f, gender: 'M' })); blur('gender')(); }}
                style={[
                  styles.genderBtn,
                  {
                    borderColor: form.gender === 'M' ? colors.primary : colors.borderStrong,
                    backgroundColor: form.gender === 'M' ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={16}
                  color={form.gender === 'M' ? colors.white : colors.inkSoft}
                />
                <Text
                  style={[
                    styles.genderBtnText,
                    { color: form.gender === 'M' ? colors.white : colors.inkSoft },
                  ]}
                >
                  Groom
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setForm((f) => ({ ...f, gender: 'F' })); blur('gender')(); }}
                style={[
                  styles.genderBtn,
                  {
                    borderColor: form.gender === 'F' ? colors.primary : colors.borderStrong,
                    backgroundColor: form.gender === 'F' ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Ionicons
                  name="people"
                  size={16}
                  color={form.gender === 'F' ? colors.white : colors.inkSoft}
                />
                <Text
                  style={[
                    styles.genderBtnText,
                    { color: form.gender === 'F' ? colors.white : colors.inkSoft },
                  ]}
                >
                  Bride
                </Text>
              </Pressable>
            </View>
            {touched.gender && stepErrors.gender && (
              <Text style={[styles.errorInline, { color: colors.error }]}>{stepErrors.gender}</Text>
            )}

            <FormField
              label="Date of Birth"
              value={form.date_of_birth}
              onChangeText={set('date_of_birth')}
              onBlur={blur('date_of_birth')}
              placeholder="YYYY-MM-DD (e.g. 1995-06-15)"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              count
              error={touched.date_of_birth ? stepErrors.date_of_birth : null}
              hint={touched.date_of_birth ? undefined : 'Must be 18 years or older'}
            />
          </>
        );

      // Step 1: Education & Career
      case 1:
        return (
          <>
            <FormField
              label="Education Level"
              value={form.education}
              onChangeText={set('education')}
              onBlur={blur('education')}
              placeholder="B.Eng in Software Engineering"
              maxLength={200}
              error={touched.education ? stepErrors.education : null}
            />
            <FormField
              label="Current Occupation"
              value={form.occupation}
              onChangeText={set('occupation')}
              onBlur={blur('occupation')}
              placeholder="Senior Data Scientist"
              maxLength={200}
              error={touched.occupation ? stepErrors.occupation : null}
            />
          </>
        );

      // Step 2: Height
      case 2:
        return (
          <View style={styles.heightRow}>
            <SelectField
              label="Height (Feet)"
              options={[3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n} ft` }))}
              value={form.height_feet}
              onChange={set('height_feet')}
              error={touched.height_feet ? stepErrors.height_feet : null}
              containerStyle={styles.heightInput}
            />
            <SelectField
              label="Height (Inches)"
              options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` }))}
              value={form.height_inches}
              onChange={set('height_inches')}
              error={touched.height_inches ? stepErrors.height_inches : null}
              containerStyle={styles.heightInput}
            />
          </View>
        );

      // Step 3: Lifestyle
      case 3:
        return (
          <>
            <SelectField
              label="Dietary Preference"
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
              label="Career Goals"
              options={CAREER_GOALS}
              value={form.career_goals}
              onChange={set('career_goals')}
            />
            <SelectField
              label="Relocation Willingness"
              options={RELOCATE}
              value={form.willing_to_relocate}
              onChange={set('willing_to_relocate')}
            />
          </>
        );

      // Step 4: Income & Dosham
      case 4:
        return (
          <>
            <SelectField
              label="Annual Income Range"
              options={INCOME_RANGE}
              value={form.income_range}
              onChange={set('income_range')}
              error={touched.income_range ? stepErrors.income_range : null}
            />
            <SelectField
              label="Manglik / Chevvai Dosham"
              options={MANGLIK}
              value={form.manglik_status}
              onChange={set('manglik_status')}
              error={touched.manglik_status ? stepErrors.manglik_status : null}
            />
          </>
        );

      // Step 5: Religion & Caste
      case 5:
        return (
          <>
            <SelectField
              label="Religion"
              options={(meta?.religions || []).map((r) => ({
                value: String(r.id),
                label: r.name_en,
              }))}
              value={form.religion_id}
              onChange={set('religion_id')}
              error={touched.religion_id ? stepErrors.religion_id : null}
              required
            />
            <SelectField
              label="Caste / Saathi"
              options={(meta?.castes || []).map((c) => ({
                value: String(c.id),
                label: c.name_en,
              }))}
              value={form.caste_id}
              onChange={set('caste_id')}
              error={touched.caste_id ? stepErrors.caste_id : null}
              required
            />
            <FormField
              label="Sub-Religion / Sect"
              value={form.sub_religion}
              onChangeText={set('sub_religion')}
              placeholder="Saiva Siddhantam (optional)"
              maxLength={200}
            />
          </>
        );

      // Step 6: Astrology
      case 6:
        return (
          <View style={styles.heightRow}>
            <SelectField
              label="Zodiac / Raasi"
              options={(meta?.raasis || []).map((r) => ({
                value: String(r.id),
                label: r.name_en,
              }))}
              value={form.raasi_id}
              onChange={set('raasi_id')}
              error={touched.raasi_id ? stepErrors.raasi_id : null}
              required
              containerStyle={styles.heightInput}
            />
            <SelectField
              label="Star / Nakshatram"
              options={(meta?.stars || []).map((s) => ({
                value: String(s.id),
                label: s.name_en,
              }))}
              value={form.star_id}
              onChange={set('star_id')}
              error={touched.star_id ? stepErrors.star_id : null}
              required
              containerStyle={styles.heightInput}
            />
          </View>
        );

      // Step 7: Location
      case 7:
        return (
          <>
            <SelectField
              label="Country of Birth"
              options={(meta?.countries || []).map((c) => ({
                value: c.code,
                label: c.name_en,
              }))}
              value={form.born_country_id}
              onChange={set('born_country_id')}
              error={touched.born_country_id ? stepErrors.born_country_id : null}
              required
            />
            <SelectField
              label="Current Country of Residence"
              options={(meta?.countries || []).map((c) => ({
                value: c.code,
                label: c.name_en,
              }))}
              value={form.current_country_id}
              onChange={set('current_country_id')}
              error={touched.current_country_id ? stepErrors.current_country_id : null}
              required
            />
            <FormField
              label="Current City or State"
              value={form.city_or_state}
              onChangeText={set('city_or_state')}
              onBlur={blur('city_or_state')}
              placeholder="Toronto"
              maxLength={100}
              error={touched.city_or_state ? stepErrors.city_or_state : null}
            />
          </>
        );

      // Step 8: Photos & Privacy
      case 8:
        return (
          <>
            <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>
              Main Profile Photo
            </Text>
            <Pressable
              onPress={pickPhoto}
              style={[
                styles.photoBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="camera" size={24} color={colors.primary} />
              <Text style={[styles.photoBtnText, { color: colors.inkSoft }]}>
                {photoUri ? 'Change photo' : 'Select photo (.jpg, .jpeg, .png)'}
              </Text>
            </Pressable>
            {photoUri && (
              <Text style={[styles.photoHint, { color: colors.success }]}>✓ Photo selected</Text>
            )}

            <Text style={[styles.fieldLabel, { color: colors.inkSoft, marginTop: spacing.md }]}>
              Horoscope Chart
            </Text>
            <Pressable
              onPress={pickHoroscope}
              style={[
                styles.photoBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="document" size={24} color={colors.primary} />
              <Text style={[styles.photoBtnText, { color: colors.inkSoft }]}>
                {horoscopeUri ? 'Change horoscope' : 'Select horoscope (.jpg, .png, .pdf)'}
              </Text>
            </Pressable>
            {horoscopeUri && (
              <Text style={[styles.photoHint, { color: colors.success }]}>✓ Horoscope selected</Text>
            )}

            <View style={[styles.privacyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.privacyTitle, { color: colors.ink }]}>Privacy & Photo Settings</Text>

              <Pressable
                onPress={() => setForm((f) => ({ ...f, blur_photo: f.blur_photo === 1 ? 0 : 1 }))}
                style={styles.toggleRow}
              >
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.ink }]}>Blur my photo</Text>
                  <Text style={[styles.toggleHint, { color: colors.inkFaint }]}>
                    Your photo stays hidden until you accept an interest
                  </Text>
                </View>
                <Ionicons
                  name={form.blur_photo === 1 ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={form.blur_photo === 1 ? colors.primary : colors.inkFaint}
                />
              </Pressable>

              <Pressable
                onPress={() => setForm((f) => ({ ...f, blur_horoscope: f.blur_horoscope === 1 ? 0 : 1 }))}
                style={styles.toggleRow}
              >
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.ink }]}>Blur my horoscope</Text>
                  <Text style={[styles.toggleHint, { color: colors.inkFaint }]}>
                    Keep your horoscope private until mutual interest
                  </Text>
                </View>
                <Ionicons
                  name={form.blur_horoscope === 1 ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={form.blur_horoscope === 1 ? colors.primary : colors.inkFaint}
                />
              </Pressable>
            </View>
          </>
        );

      // Step 9: Bio & Review
      case 9:
        return (
          <>
            <FormField
              label="About Me"
              value={form.about_me}
              onChangeText={set('about_me')}
              onBlur={blur('about_me')}
              placeholder="Hello, looking for an understanding partner who values family traditions…"
              multiline
              maxLength={2000}
              count
              error={touched.about_me ? stepErrors.about_me : null}
              hint={touched.about_me ? undefined : 'Minimum 50 characters — tell your story'}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />

            <View style={[styles.reviewCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.reviewText, { color: colors.inkSoft }]}>
                Your profile is{' '}
                <Text style={{ color: colors.ink, fontWeight: '700' }}>{completion}% complete</Text>.
                Review the summary below before publishing.
              </Text>
            </View>

            <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {profileSteps.slice(0, 9).map((s, i) => (
                <View key={s.key} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.summaryLabel, { color: colors.inkFaint }]}>{s.title}</Text>
                  <Text style={[styles.summaryStatus, { color: validSteps[i] ? colors.success : colors.error }]}>
                    {validSteps[i] ? '✓ Complete' : 'Incomplete'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  if (!meta) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={32} color={colors.inkFaint} />
          <Text style={[styles.loadingText, { color: colors.inkSoft }]}>Loading form…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerLabel, { color: colors.primary }]}>
              Step {step + 1} of {profileSteps.length}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.ink }]}>
              {profileSteps[step].title}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <ProgressBar value={completion} />
          <StepIndicator
            steps={profileSteps}
            current={step}
            maxReachable={maxReachable}
            validSteps={validSteps}
            onStepClick={goToStep}
          />
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step heading */}
          <View style={styles.stepHeading}>
            <View style={[styles.stepIcon, { backgroundColor: colors.primary }]}>
              <Ionicons
                name={profileSteps[step].icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={colors.white}
              />
            </View>
            <View style={styles.stepHeadingText}>
              <Text style={[styles.stepNumber, { color: colors.primary }]}>
                Step {step + 1} of {profileSteps.length}
              </Text>
              <Text style={[styles.stepTitle, { color: colors.ink }]}>
                {profileSteps[step].title}
              </Text>
            </View>
            {validSteps[step] && (
              <View style={[styles.completeBadge, { backgroundColor: colors.successSoft }]}>
                <Text style={[styles.completeBadgeText, { color: colors.success }]}>Complete</Text>
              </View>
            )}
          </View>

          {serverError && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
              <Text style={[styles.errorBoxText, { color: colors.error }]}>{serverError}</Text>
              <Pressable onPress={() => setServerError(null)}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </Pressable>
            </View>
          )}

          {renderStep()}
        </ScrollView>

        {/* Navigation */}
        <View style={[styles.navBar, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <Button
            title="Back"
            variant="secondary"
            size="md"
            onPress={goBack}
            disabled={step === 0}
            leftIcon="arrow-back"
          />
          {step < profileSteps.length - 1 ? (
            <Button
              title="Continue"
              variant="primary"
              size="md"
              onPress={goNext}
              leftIcon="arrow-forward"
            />
          ) : (
            <Button
              title="Publish Profile"
              variant="primary"
              size="md"
              onPress={submit}
              loading={loading}
              leftIcon="checkmark-circle"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...typography.body,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLabel: {
    ...typography.label,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...typography.title,
    fontSize: 16,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: layout.bottomContentInset,
  },
  stepHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHeadingText: {
    flex: 1,
  },
  stepNumber: {
    ...typography.label,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepTitle: {
    ...typography.title,
    fontSize: 18,
  },
  completeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  completeBadgeText: {
    ...typography.label,
    fontWeight: '700',
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
  heightInput: {
    flex: 1,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  photoBtnText: {
    ...typography.body,
    flex: 1,
  },
  photoHint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  privacyCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  privacyTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  toggleHint: {
    ...typography.caption,
    marginTop: 2,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reviewText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 20,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: {
    ...typography.caption,
  },
  summaryStatus: {
    ...typography.label,
    fontWeight: '700',
  },
  errorInline: {
    ...typography.label,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
});
