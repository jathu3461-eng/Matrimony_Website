import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { Screen } from '@/components/Screen';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateBusinessName,
  fieldError,
  HINTS,
} from '@/utils/validation';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { radius, spacing, typography } from '@/theme';
import { DEFAULT_COUNTRY, type CountryCode } from '@/data/countryCodes';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY.code);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'regular' | 'broker'>('regular');
  const [businessName, setBusinessName] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const fullPhone = phone.trim() ? `${selectedCountry.dialCode}${phone.trim()}` : '';

  const errors = useMemo(
    () => ({
      username: fieldError(username, touched.username, validateUsername),
      email: fieldError(email, touched.email, validateEmail),
      password: fieldError(password, touched.password, validatePassword),
      confirm: fieldError(confirm, touched.confirm, (v) => validateConfirmPassword(password, v)),
      phone: phone.trim() && !/^\d{7,15}$/.test(phone.trim()) ? 'Enter a valid number' : null,
      businessName:
        role === 'broker'
          ? fieldError(businessName, touched.businessName, validateBusinessName)
          : null,
    }),
    [username, email, phone, password, confirm, role, businessName, touched, selectedCountry]
  );

  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async () => {
    setTouched({
      username: true,
      email: true,
      phone: true,
      password: true,
      confirm: true,
      businessName: true,
    });
    if (hasErrors || !phone.trim()) return;

    setServerError(null);
    setLoading(true);
    try {
      // Send phone OTP first
      await authApi.sendPhoneOtp(fullPhone);
      // Navigate to phone OTP verification
      navigation.navigate('PhoneOTP', {
        phone: fullPhone,
        email: email.trim(),
        password,
        username: username.trim(),
        role,
        ...(role === 'broker' ? { businessName: businessName.trim() } : {}),
      });
    } catch (err) {
      setServerError(extractError(err, 'Unable to send verification code.'));
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
            <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
              <Ionicons name="heart" size={24} color={colors.white} />
            </View>
            <Text style={[styles.title, { color: colors.ink }]}>{t('signupTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.inkFaint }]}>{t('signupSubtitle')}</Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.black,
              },
            ]}
          >
            <View style={styles.roleRow}>
              <Button
                title="Regular User"
                variant={role === 'regular' ? 'primary' : 'outline'}
                size="sm"
                style={styles.roleBtn}
                onPress={() => setRole('regular')}
              />
              <Button
                title="Broker"
                variant={role === 'broker' ? 'primary' : 'outline'}
                size="sm"
                style={styles.roleBtn}
                onPress={() => setRole('broker')}
              />
            </View>

            <FormField
              label={t('username')}
              value={username}
              onChangeText={setUsername}
              onBlur={() => touch('username')}
              placeholder="e.g. john_95"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              count
              error={errors.username}
              hint={HINTS.username}
            />
            <FormField
              label={t('emailLabel')}
              value={email}
              onChangeText={setEmail}
              onBlur={() => touch('email')}
              placeholder={t('emailPlaceholder')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
              hint={t('emailPlaceholder')}
            />

            {/* Phone with Country Code */}
            <Text style={[styles.phoneLabel, { color: colors.inkSoft }]}>
              {t('mobileLabel')}
            </Text>
            <View style={styles.phoneRow}>
              <CountryCodePicker
                selectedCode={countryCode}
                onSelect={(c: CountryCode) => {
                  setCountryCode(c.code);
                  setSelectedCountry(c);
                }}
              />
              <FormField
                label=""
                value={phone}
                onChangeText={setPhone}
                onBlur={() => touch('phone')}
                placeholder="77 123 4567"
                keyboardType="phone-pad"
                error={errors.phone}
                containerStyle={styles.phoneInput}
              />
            </View>

            <FormField
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              onBlur={() => touch('password')}
              placeholder={t('passwordPlaceholder')}
              secure
              autoCapitalize="none"
              error={errors.password}
              hint={t('passwordPlaceholder')}
            />
            <FormField
              label={t('confirmPassword')}
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => touch('confirm')}
              placeholder={t('confirmPlaceholder')}
              secure
              autoCapitalize="none"
              error={errors.confirm}
              hint={t('confirmPlaceholder')}
            />

            {role === 'broker' && (
              <FormField
                label={t('username') + ' / Business'}
                value={businessName}
                onChangeText={setBusinessName}
                onBlur={() => touch('businessName')}
                placeholder="Your agency name"
                error={errors.businessName}
              />
            )}

            {serverError && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.errorBoxText, { color: colors.error }]}>{serverError}</Text>
              </View>
            )}

            <Button title={t('continue')} onPress={submit} loading={loading} size="lg" />
          </View>

          <View style={styles.footer}>
            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: colors.inkSoft }]}>
                {t('alreadyHave')}{' '}
              </Text>
              <Button
                title={t('loginButton')}
                variant="ghost"
                size="sm"
                titleStyle={{ fontWeight: '700' }}
                onPress={() => navigation.navigate('Login')}
              />
            </View>
          </View>
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
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: spacing.lg,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleBtn: {
    flex: 1,
  },
  phoneLabel: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
  },
});
