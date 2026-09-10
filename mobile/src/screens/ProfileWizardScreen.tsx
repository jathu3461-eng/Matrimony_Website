import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { SearchablePicker } from '@/components/SearchablePicker';
import { HeightPicker } from '@/components/HeightPicker';
import { Screen } from '@/components/Screen';
import { profileApi } from '@/api/profiles';
import { extractError } from '@/api/client';
import { useProfile, type ProfileFormData } from '@/context/ProfileContext';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { radius, spacing, typography } from '@/theme';
import {
  validateName,
  validateDob,
  validateHeightFeet,
  validateHeightInches,
  validateLongText,
  validateAboutMe,
  fieldError,
} from '@/utils/validation';
import type { Profile } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type WizardRoute = RouteProp<RootStackParamList, 'ProfileWizard'>;

const STEPS = [
  { key: 'basic', icon: 'person-outline', titleKey: 'stepBasics' as const, hintKey: 'stepBasicsHint' as const },
  { key: 'education', icon: 'school-outline', titleKey: 'stepEducation' as const, hintKey: 'stepEducationHint' as const },
  { key: 'height', icon: 'resize-outline', titleKey: 'stepHeight' as const, hintKey: 'stepHeightHint' as const },
  { key: 'lifestyle', icon: 'heart-outline', titleKey: 'stepLifestyle' as const, hintKey: 'stepLifestyleHint' as const },
  { key: 'income', icon: 'wallet-outline', titleKey: 'stepIncome' as const, hintKey: 'stepIncomeHint' as const },
  { key: 'religion', icon: 'earth-outline', titleKey: 'stepReligion' as const, hintKey: 'stepReligionHint' as const },
  { key: 'astrology', icon: 'star-outline', titleKey: 'stepAstrology' as const, hintKey: 'stepAstrologyHint' as const },
  { key: 'location', icon: 'location-outline', titleKey: 'stepLocation' as const, hintKey: 'stepLocationHint' as const },
  { key: 'media', icon: 'camera-outline', titleKey: 'stepMedia' as const, hintKey: 'stepMediaHint' as const },
  { key: 'bio', icon: 'document-text-outline', titleKey: 'stepBio' as const, hintKey: 'stepBioHint' as const },
];

const POSTED_BY_OPTIONS = [
  'Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend', 'Client',
];

const DIET_OPTIONS = [
  { value: 'any', labelKey: 'dietAny' as const },
  { value: 'vegetarian', labelKey: 'dietVegetarian' as const },
  { value: 'non_vegetarian', labelKey: 'dietNonVegetarian' as const },
  { value: 'vegan', labelKey: 'dietVegan' as const },
  { value: 'jain', labelKey: 'dietJain' as const },
];
const FAMILY_VALUES_OPTIONS = [
  { value: 'traditional', labelKey: 'familyTraditional' as const },
  { value: 'moderate', labelKey: 'familyModerate' as const },
  { value: 'liberal', labelKey: 'familyLiberal' as const },
];
const CAREER_GOALS_OPTIONS = [
  { value: 'working', labelKey: 'careerWorking' as const },
  { value: 'home_maker', labelKey: 'careerHomeMaker' as const },
  { value: 'open', labelKey: 'careerOpen' as const },
];
const RELOCATE_OPTIONS = [
  { value: 'open', labelKey: 'relocateOpen' as const },
  { value: 'local_only', labelKey: 'relocateLocal' as const },
  { value: 'overseas_only', labelKey: 'relocateOverseas' as const },
];
const INCOME_OPTIONS = [
  { value: 'Under $50k', labelKey: 'incomeUnder50' as const },
  { value: '$50k - $100k', labelKey: 'income50to100' as const },
  { value: '$100k - $150k', labelKey: 'income100to150' as const },
  { value: '$150k+', labelKey: 'income150plus' as const },
];
const MANGLIK_OPTIONS = [
  { value: 'no', labelKey: 'manglikNo' as const },
  { value: 'yes', labelKey: 'manglikYes' as const },
  { value: 'dont_know', labelKey: 'manglikDontKnow' as const },
];

export function ProfileWizardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<WizardRoute>();
  const { colors } = useTheme();
  const { t, lang, setLang } = useI18n();
  const {
    form,
    setField,
    setForm,
    resetForm,
    photoUri,
    setPhotoUri,
    horoscopeUri,
    setHoroscopeUri,
    currentStep,
    setCurrentStep,
  } = useProfile();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (f: string) => setTouched((p) => ({ ...p, [f]: true }));

  const editId = route.params?.editId;
  const mode = route.params?.mode ?? (editId ? 'edit' : 'create');
  const isEdit = mode === 'edit' && !!editId;
  const isOnboarding = !isEdit && mode === 'onboarding';

  const meta = useQuery({
    queryKey: ['profile-meta'],
    queryFn: () => profileApi.getMeta(),
  });

  // Load the profile into the wizard when editing.
  useEffect(() => {
    if (!editId) return;
    profileApi
      .getById(editId)
      .then((p: Profile) => {
        resetForm();
        setForm(toFormData(p));
        setCurrentStep(9); // start on the review step so edits are fast
      })
      .catch(() => {});
  }, [editId, resetForm, setForm, setCurrentStep]);

  const stepErrors = useMemo(() => {
    const errs: Record<string, string | null> = {};
    switch (currentStep) {
      case 0:
        errs.name = fieldError(form.name, touched.name, validateName);
        errs.date_of_birth = fieldError(form.date_of_birth, touched.date_of_birth, validateDob);
        if (!form.gender) errs.gender = 'Required';
        if (!form.profile_registered_for) errs.profile_registered_for = 'Required';
        break;
      case 1:
        errs.education = fieldError(form.education, touched.education, (v) => validateLongText(v, 'Education'));
        errs.occupation = fieldError(form.occupation, touched.occupation, (v) => validateLongText(v, 'Occupation'));
        break;
      case 2:
        errs.height_feet = fieldError(form.height_feet, touched.height_feet, validateHeightFeet);
        errs.height_inches = fieldError(form.height_inches, touched.height_inches, validateHeightInches);
        break;
      case 5:
        if (!form.religion_id) errs.religion_id = t('errSelectReligion');
        if (!form.caste_id) errs.caste_id = t('errSelectCaste');
        break;
      case 6:
        if (!form.raasi_id) errs.raasi_id = t('errSelectRaasi');
        if (!form.star_id) errs.star_id = t('errSelectStar');
        break;
      case 7:
        if (!form.born_country_id) errs.born_country_id = t('errSelectCountry');
        if (!form.current_country_id) errs.current_country_id = t('errSelectCountry');
        errs.city_or_state = fieldError(form.city_or_state, touched.city_or_state, (v) => {
          if (v.length < 2) return t('errCityRequired');
          return null;
        });
        break;
      case 9:
        errs.about_me = fieldError(form.about_me, touched.about_me, validateAboutMe);
        break;
    }
    return errs;
  }, [currentStep, form, touched, t]);

  const hasStepErrors = Object.values(stepErrors).some(Boolean);

  const markStepTouched = useCallback(() => {
    const fields = getStepFields(currentStep);
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, true])) }));
  }, [currentStep]);

  const goNext = () => {
    markStepTouched();
    if (hasStepErrors) return;
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
  };

  const pickHoroscope = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) setHoroscopeUri(res.assets[0].uri);
  };

  const handleSubmit = async () => {
    setServerError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (photoUri) {
        const ext = photoUri.split('.').pop() || 'jpg';
        fd.append('main_profile_picture', {
          uri: photoUri,
          name: `profile.${ext}`,
          type: `image/${ext}`,
        } as unknown as Blob);
      }
      if (horoscopeUri) {
        const ext = horoscopeUri.split('.').pop() || 'jpg';
        fd.append('horoscope_chart', {
          uri: horoscopeUri,
          name: `horoscope.${ext}`,
          type: `image/${ext}`,
        } as unknown as Blob);
      }
      if (isEdit) {
        await profileApi.update(editId, fd);
        Alert.alert(t('success'), t('profileUpdated'), [
          { text: t('ok'), onPress: () => navigation.goBack() },
        ]);
      } else {
        await profileApi.create(fd);
        Alert.alert(t('success'), t('profileCreated'), [
          {
            text: t('ok'),
            onPress: () => {
              if (isOnboarding) navigation.replace('Main', undefined);
              else navigation.goBack();
            },
          },
        ]);
      }
    } catch (err) {
      setServerError(extractError(err, 'Failed to save profile.'));
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.round(((currentStep + 1) / STEPS.length) * 100);
  const currentMeta = meta.data;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            {currentStep > 0 && (
              <Pressable onPress={goBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={colors.ink} />
              </Pressable>
            )}
            <View>
              <Text style={[styles.stepLabel, { color: colors.primary }]}>
                {t('step')} {currentStep + 1} {t('of')} {STEPS.length}
              </Text>
              <Text style={[styles.stepTitle, { color: colors.ink }]}>{t(STEPS[currentStep].titleKey)}</Text>
            </View>
          </View>
          <Text style={[styles.progressText, { color: colors.inkFaint }]}>{progressPercent}%</Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progressPercent}%` }]} />
        </View>

        {/* Step dots */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dotsRow}
        >
          {STEPS.map((s, i) => (
            <Pressable
              key={s.key}
              style={[
                styles.dot,
                i === currentStep
                  ? { backgroundColor: colors.primary }
                  : i < currentStep
                    ? { backgroundColor: colors.success }
                    : { backgroundColor: colors.border },
              ]}
              onPress={() => i <= currentStep && setCurrentStep(i)}
            >
              <Text style={[styles.dotText, { color: i <= currentStep ? '#fff' : colors.inkFaint }]}>
                {i < currentStep ? '✓' : i + 1}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {serverError && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
              <Text style={[styles.errorBoxText, { color: colors.error }]}>{serverError}</Text>
            </View>
          )}

          {/* Step 0: Basics */}
          {currentStep === 0 && (
            <>
              <View style={[styles.privacyBox, { borderColor: colors.border }]}>
                <Text style={[styles.privacyTitle, { color: colors.ink }]}>{t('preferredLanguage')}</Text>
                <View style={styles.genderRow}>
                  {(['en', 'ta'] as const).map((l) => (
                    <Pressable
                      key={l}
                      style={[
                        styles.genderBtn,
                        {
                          backgroundColor: lang === l ? colors.primary : colors.surface,
                          borderColor: lang === l ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setLang(l)}
                    >
                      <Text
                        style={{
                          color: lang === l ? '#fff' : colors.ink,
                          fontWeight: '700',
                          fontSize: 15,
                        }}
                      >
                        {l === 'en' ? t('languageEnglish') : t('languageTamil')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <SearchablePicker
                label={t('profilePostedBy')}
                options={POSTED_BY_OPTIONS.map((p) => ({ value: p, label: p }))}
                value={form.profile_registered_for}
                onChange={(v) => setField('profile_registered_for', v)}
              />

              <FormField
                label={t('fullName')}
                value={form.name}
                onChangeText={(v) => setField('name', v)}
                onBlur={() => touch('name')}
                placeholder={t('namePlaceholder')}
                maxLength={60}
                count
                error={stepErrors.name}
              />

              <Text style={[styles.fieldLabel, { color: colors.inkSoft }]}>{t('lookingFor')} *</Text>
              <View style={styles.genderRow}>
                {(['M', 'F'] as const).map((g) => (
                  <Pressable
                    key={g}
                    style={[
                      styles.genderBtn,
                      {
                        backgroundColor: form.gender === g ? colors.primary : colors.surface,
                        borderColor: form.gender === g ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setField('gender', g)}
                  >
                    <Ionicons
                      name={g === 'M' ? 'man-outline' : 'woman-outline'}
                      size={20}
                      color={form.gender === g ? '#fff' : colors.ink}
                    />
                    <Text style={{ color: form.gender === g ? '#fff' : colors.ink, fontWeight: '700', fontSize: 15 }}>
                      {g === 'M' ? t('lookingForGroom') : t('lookingForBride')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {stepErrors.gender && touched.gender && (
                <Text style={[styles.error, { color: colors.error }]}>{stepErrors.gender}</Text>
              )}

              <FormField
                label={t('dateOfBirth')}
                value={form.date_of_birth}
                onChangeText={(v) => setField('date_of_birth', v)}
                onBlur={() => touch('date_of_birth')}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                count
                error={stepErrors.date_of_birth}
                hint={t('dobHelp')}
              />
            </>
          )}

          {/* Step 1: Education */}
          {currentStep === 1 && (
            <>
              <FormField
                label={t('educationLevel')}
                value={form.education}
                onChangeText={(v) => setField('education', v)}
                onBlur={() => touch('education')}
                placeholder={t('educationPlaceholder')}
                error={stepErrors.education}
              />
              <FormField
                label={t('occupation')}
                value={form.occupation}
                onChangeText={(v) => setField('occupation', v)}
                onBlur={() => touch('occupation')}
                placeholder={t('occupationPlaceholder')}
                error={stepErrors.occupation}
              />
            </>
          )}

          {/* Step 2: Height */}
          {currentStep === 2 && (
            <HeightPicker
              feet={form.height_feet}
              inches={form.height_inches}
              onFeetChange={(v) => setField('height_feet', v)}
              onInchesChange={(v) => setField('height_inches', v)}
              errorFeet={stepErrors.height_feet}
              errorInches={stepErrors.height_inches}
            />
          )}

          {/* Step 3: Lifestyle */}
          {currentStep === 3 && (
            <>
              <SearchablePicker
                label={t('dietaryPreference')}
                options={DIET_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                value={form.diet}
                onChange={(v) => setField('diet', v)}
              />
              <SearchablePicker
                label={t('familyValues')}
                options={FAMILY_VALUES_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                value={form.family_values}
                onChange={(v) => setField('family_values', v)}
              />
              <SearchablePicker
                label={t('careerGoals')}
                options={CAREER_GOALS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                value={form.career_goals}
                onChange={(v) => setField('career_goals', v)}
              />
              <SearchablePicker
                label={t('relocationWillingness')}
                options={RELOCATE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                value={form.willing_to_relocate}
                onChange={(v) => setField('willing_to_relocate', v)}
              />
            </>
          )}

          {/* Step 4: Income & Dosham */}
          {currentStep === 4 && (
            <>
              <SearchablePicker
                label={t('annualIncome')}
                options={INCOME_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                value={form.income_range}
                onChange={(v) => setField('income_range', v)}
              />
              <SearchablePicker
                label={t('manglikStatus')}
                options={MANGLIK_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
                value={form.manglik_status}
                onChange={(v) => setField('manglik_status', v)}
              />
            </>
          )}

          {/* Step 5: Religion & Caste */}
          {currentStep === 5 && currentMeta && (
            <>
              <SearchablePicker
                label={t('religion')}
                options={currentMeta.religions.map((r) => ({ value: r.id, label: lang === 'ta' ? r.name_ta : r.name_en }))}
                value={form.religion_id}
                onChange={(v) => setField('religion_id', v)}
                error={stepErrors.religion_id}
                required
              />
              <SearchablePicker
                label={t('caste')}
                options={currentMeta.castes.map((c) => ({ value: c.id, label: lang === 'ta' ? c.name_ta : c.name_en }))}
                value={form.caste_id}
                onChange={(v) => setField('caste_id', v)}
                error={stepErrors.caste_id}
                required
              />
              <FormField
                label={t('subReligion')}
                value={form.sub_religion}
                onChangeText={(v) => setField('sub_religion', v)}
                placeholder={t('subReligionPlaceholder')}
              />
            </>
          )}

          {/* Step 6: Astrology */}
          {currentStep === 6 && currentMeta && (
            <>
              <SearchablePicker
                label={t('zodiacRaasi')}
                options={currentMeta.raasis.map((r) => ({ value: r.id, label: lang === 'ta' ? r.name_ta : r.name_en }))}
                value={form.raasi_id}
                onChange={(v) => setField('raasi_id', v)}
                error={stepErrors.raasi_id}
                required
              />
              <SearchablePicker
                label={t('starNakshatram')}
                options={currentMeta.stars.map((s) => ({ value: s.id, label: lang === 'ta' ? s.name_ta : s.name_en }))}
                value={form.star_id}
                onChange={(v) => setField('star_id', v)}
                error={stepErrors.star_id}
                required
              />
            </>
          )}

          {/* Step 7: Location */}
          {currentStep === 7 && currentMeta && (
            <>
              <SearchablePicker
                label={t('countryOfBirth')}
                options={currentMeta.countries.map((c) => ({ value: c.code, label: lang === 'ta' ? c.name_ta : c.name_en }))}
                value={form.born_country_id}
                onChange={(v) => setField('born_country_id', v)}
                error={stepErrors.born_country_id}
                required
              />
              <SearchablePicker
                label={t('currentCountry')}
                options={currentMeta.countries.map((c) => ({ value: c.code, label: lang === 'ta' ? c.name_ta : c.name_en }))}
                value={form.current_country_id}
                onChange={(v) => setField('current_country_id', v)}
                error={stepErrors.current_country_id}
                required
              />
              <FormField
                label={t('currentCity')}
                value={form.city_or_state}
                onChangeText={(v) => setField('city_or_state', v)}
                onBlur={() => touch('city_or_state')}
                placeholder={t('cityPlaceholder')}
                error={stepErrors.city_or_state}
              />
            </>
          )}

          {/* Step 8: Media & Privacy */}
          {currentStep === 8 && (
            <>
              <Pressable
                style={[styles.uploadBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickPhoto}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={[styles.uploadText, { color: colors.ink }]}>
                  {photoUri ? t('changePhoto') : t('addPhoto')}
                </Text>
              </Pressable>
              {photoUri && (
                <Text style={[styles.successHint, { color: colors.success }]}>✓ Photo selected</Text>
              )}

              <Pressable
                style={[styles.uploadBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickHoroscope}
              >
                <Ionicons name="document" size={24} color={colors.primary} />
                <Text style={[styles.uploadText, { color: colors.ink }]}>
                  {horoscopeUri ? 'Change horoscope chart' : t('horoscopeChart')}
                </Text>
              </Pressable>
              {horoscopeUri && (
                <Text style={[styles.successHint, { color: colors.success }]}>✓ Chart selected</Text>
              )}

              <View style={[styles.privacyBox, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
                <Text style={[styles.privacyTitle, { color: colors.ink }]}>{t('privacySettings')}</Text>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleLabel, { color: colors.ink }]}>{t('blurPhoto')}</Text>
                    <Text style={[styles.toggleHint, { color: colors.inkFaint }]}>{t('blurPhotoHint')}</Text>
                  </View>
                  <Switch
                    value={form.blur_photo === 1}
                    onValueChange={(v) => setField('blur_photo', v ? 1 : 0)}
                    trackColor={{ true: colors.primary, false: colors.border }}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleLabel, { color: colors.ink }]}>{t('blurHoroscope')}</Text>
                    <Text style={[styles.toggleHint, { color: colors.inkFaint }]}>{t('blurHoroscopeHint')}</Text>
                  </View>
                  <Switch
                    value={form.blur_horoscope === 1}
                    onValueChange={(v) => setField('blur_horoscope', v ? 1 : 0)}
                    trackColor={{ true: colors.primary, false: colors.border }}
                  />
                </View>
              </View>
            </>
          )}

          {/* Step 9: Bio */}
          {currentStep === 9 && (
            <>
              <FormField
                label={t('aboutMe')}
                value={form.about_me}
                onChangeText={(v) => setField('about_me', v)}
                onBlur={() => touch('about_me')}
                placeholder={t('aboutMePlaceholder')}
                multiline
                style={{ minHeight: 120, textAlignVertical: 'top' }}
                maxLength={2000}
                count
                error={stepErrors.about_me}
                hint={t('aboutMeHelp')}
              />

              <View style={[styles.completeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={[styles.completeText, { color: colors.inkSoft }]}>
                  {t('profileCompleteness', { percent: String(progressPercent) })}
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom nav */}
        <View style={[styles.bottomNav, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          {currentStep > 0 && (
            <Button title={t('back')} variant="outline" size="md" onPress={goBack} style={styles.navBtn} />
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button title={t('next')} size="md" onPress={goNext} style={styles.navBtn} />
          ) : (
            <Button title={t('publishProfile')} size="md" onPress={handleSubmit} loading={loading} style={styles.navBtn} />
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function toFormData(p: Profile): ProfileFormData {
  return {
    profile_registered_for: p.profile_registered_for ?? 'Self',
    name: p.name,
    gender: p.gender,
    date_of_birth: p.date_of_birth,
    education: p.education ?? '',
    occupation: p.occupation ?? '',
    height_feet: p.height_feet?.toString() ?? '5',
    height_inches: p.height_inches?.toString() ?? '6',
    diet: p.diet ?? 'any',
    family_values: p.family_values ?? 'moderate',
    career_goals: p.career_goals ?? 'working',
    willing_to_relocate: p.willing_to_relocate ?? 'open',
    income_range: p.income_range ?? '$50k - $100k',
    manglik_status: p.manglik_status ?? 'no',
    religion_id: p.religion_id?.toString() ?? '',
    caste_id: p.caste_id?.toString() ?? '',
    sub_religion: p.sub_religion ?? '',
    raasi_id: p.raasi_id?.toString() ?? '',
    star_id: p.star_id?.toString() ?? '',
    born_country_id: p.born_country_id?.toString() ?? '',
    current_country_id: p.current_country_id?.toString() ?? '',
    city_or_state: p.city_or_state ?? '',
    blur_photo: p.blur_photo ?? 0,
    blur_horoscope: p.blur_horoscope ?? 0,
    about_me: p.about_me ?? '',
  };
}

function getStepFields(step: number): string[] {
  switch (step) {
    case 0: return ['name', 'date_of_birth', 'gender', 'profile_registered_for'];
    case 1: return ['education', 'occupation'];
    case 2: return ['height_feet', 'height_inches'];
    case 5: return ['religion_id', 'caste_id'];
    case 6: return ['raasi_id', 'star_id'];
    case 7: return ['born_country_id', 'current_country_id', 'city_or_state'];
    case 9: return ['about_me'];
    default: return [];
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: { padding: 4 },
  stepLabel: { ...typography.label, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle: { ...typography.title, fontSize: 18 },
  progressText: { ...typography.caption, fontWeight: '700' },
  progressTrack: { height: 3, marginHorizontal: spacing.md },
  progressFill: { height: 3, borderRadius: 2 },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 11, fontWeight: '700' },
  content: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  error: { ...typography.label, fontWeight: '600', marginBottom: spacing.sm },
  errorBox: { borderRadius: 10, padding: spacing.sm, marginBottom: spacing.md },
  errorBoxText: { ...typography.caption },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  uploadText: { ...typography.body, fontWeight: '600' },
  successHint: { ...typography.label, marginBottom: spacing.sm },
  privacyBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  privacyTitle: { ...typography.body, fontWeight: '700', marginBottom: spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleLabel: { ...typography.body, fontWeight: '600' },
  toggleHint: { ...typography.label, marginTop: 2 },
  completeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  completeText: { ...typography.caption, flex: 1, lineHeight: 20 },
  bottomNav: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  navBtn: { flex: 1 },
});
