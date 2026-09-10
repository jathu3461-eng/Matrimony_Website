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
import { Screen } from '@/components/Screen';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  fieldError,
  HINTS,
} from '@/utils/validation';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Step = 'email' | 'otp' | 'password';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const touch = (f: string) => setTouched((prev) => ({ ...prev, [f]: true }));

  const errors = useMemo(
    () => ({
      email: fieldError(email, touched.email, validateEmail),
      otp: fieldError(otp, touched.otp, (v) => (v.length < 4 ? t('otpInvalidCode') : null)),
      password: fieldError(newPassword, touched.password, validatePassword),
      confirm: fieldError(confirm, touched.confirm, (v) =>
        validateConfirmPassword(newPassword, v)
      ),
    }),
    [email, otp, newPassword, confirm, touched, t]
  );

  const requestOtp = async () => {
    setTouched({ email: true });
    if (errors.email) return;

    setServerError(null);
    setLoading(true);
    try {
      await authApi.requestForgotOtp(email.trim());
      setStep('otp');
    } catch (err) {
      setServerError(extractError(err, t('error')));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setTouched({ otp: true });
    if (errors.otp) return;

    setServerError(null);
    setLoading(true);
    try {
      await authApi.verifyForgotOtp(email.trim(), otp.trim());
      setStep('password');
    } catch (err) {
      setServerError(extractError(err, t('otpInvalidCode')));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setTouched({ password: true, confirm: true });
    if (errors.password || errors.confirm) return;

    setServerError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      alert(t('success'));
      navigation.popToTop();
    } catch (err) {
      setServerError(extractError(err, t('error')));
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === 'email'
      ? t('forgotPassword')
      : step === 'otp'
        ? t('otpTitle')
        : t('password');

  const stepHint =
    step === 'email'
      ? t('otpSubtitle')
      : step === 'otp'
        ? `${t('otpSubtitle')} ${email.trim()}`
        : t('passwordPlaceholder');

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
            <Text style={[styles.title, { color: colors.ink }]}>{stepTitle}</Text>
            <Text style={[styles.subtitle, { color: colors.inkFaint }]}>{stepHint}</Text>
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
            {step === 'email' && (
              <FormField
                label={t('emailLabel')}
                value={email}
                onChangeText={setEmail}
                onBlur={() => touch('email')}
                placeholder={t('emailPlaceholder')}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email}
                hint={HINTS.email}
              />
            )}

            {step === 'otp' && (
              <FormField
                label={t('otpTitle')}
                value={otp}
                onChangeText={setOtp}
                onBlur={() => touch('otp')}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                count
                error={errors.otp}
                hint={t('otpSubtitle')}
              />
            )}

            {step === 'password' && (
              <>
                <FormField
                  label={t('password')}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onBlur={() => touch('password')}
                  placeholder={t('passwordPlaceholder')}
                  secure
                  autoCapitalize="none"
                  error={errors.password}
                  hint={HINTS.password}
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
                  hint={HINTS.confirm}
                />
              </>
            )}

            {serverError && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.errorBoxText, { color: colors.error }]}>{serverError}</Text>
              </View>
            )}

            <Button
              title={
                step === 'email'
                  ? t('continue')
                  : step === 'otp'
                    ? t('otpVerify')
                    : t('save')
              }
              onPress={step === 'email' ? requestOtp : step === 'otp' ? verifyOtp : resetPassword}
              loading={loading}
              size="lg"
            />
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
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
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
});
