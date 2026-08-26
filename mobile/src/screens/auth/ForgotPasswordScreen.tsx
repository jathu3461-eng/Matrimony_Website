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
import { AnimatedLogo } from '@/components/AnimatedLogo';
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
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Step = 'email' | 'otp' | 'password';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const touch = (f: string) => setTouched((t) => ({ ...t, [f]: true }));

  const errors = useMemo(
    () => ({
      email: fieldError(email, touched.email, validateEmail),
      otp: fieldError(otp, touched.otp, (v) => (v.length < 6 ? 'Enter the 6-digit code' : null)),
      password: fieldError(newPassword, touched.password, validatePassword),
      confirm: fieldError(confirm, touched.confirm, (v) =>
        validateConfirmPassword(newPassword, v)
      ),
    }),
    [email, otp, newPassword, confirm, touched]
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
      setServerError(extractError(err, 'Could not send code.'));
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
      setServerError(extractError(err, 'Invalid code.'));
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
      alert('Password reset! You can now log in.');
      navigation.popToTop();
    } catch (err) {
      setServerError(extractError(err, 'Could not reset password.'));
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === 'email'
      ? 'Reset your password'
      : step === 'otp'
        ? 'Enter verification code'
        : 'Create new password';

  const stepHint =
    step === 'email'
      ? "Enter your email and we'll send a 6-digit code"
      : step === 'otp'
        ? `Code sent to ${email.trim()}`
        : 'Choose a strong password';

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
            <AnimatedLogo shape="arch" size={90} />
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
                label="Email"
                value={email}
                onChangeText={setEmail}
                onBlur={() => touch('email')}
                placeholder="name@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email}
                hint={HINTS.email}
              />
            )}

            {step === 'otp' && (
              <FormField
                label="Verification code"
                value={otp}
                onChangeText={setOtp}
                onBlur={() => touch('otp')}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                count
                error={errors.otp}
                hint="Enter the 6-digit code from your email"
              />
            )}

            {step === 'password' && (
              <>
                <FormField
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onBlur={() => touch('password')}
                  placeholder="Create new password"
                  secure
                  autoCapitalize="none"
                  error={errors.password}
                  hint={HINTS.password}
                />
                <FormField
                  label="Confirm password"
                  value={confirm}
                  onChangeText={setConfirm}
                  onBlur={() => touch('confirm')}
                  placeholder="Re-enter password"
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
                  ? 'Send Code'
                  : step === 'otp'
                    ? 'Verify Code'
                    : 'Reset Password'
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
    alignItems: 'center',
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
