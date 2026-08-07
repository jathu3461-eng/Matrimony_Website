import { useState } from 'react';
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
  HINTS,
} from '@/utils/validation';
import { colors, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Step = 'email' | 'otp' | 'password';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const touch = (f: string) => setTouched((t) => ({ ...t, [f]: true }));

  const emailError = touched.email ? validateEmail(email) : null;
  const otpError = touched.otp && otp.trim().length < 4 ? 'Enter the 6-digit code' : null;
  const passwordError = touched.password ? validatePassword(newPassword) : null;
  const confirmError = touched.confirm
    ? newPassword !== confirm
      ? 'Passwords do not match'
      : null
    : null;

  const requestOtp = async () => {
    setTouched({ email: true });
    if (validateEmail(email)) return;

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
    if (otp.trim().length < 4) return;

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
    if (validatePassword(newPassword) || newPassword !== confirm) return;

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{stepTitle}</Text>
            <Text style={styles.subtitle}>{stepHint}</Text>
          </View>

          <View style={styles.card}>
            {step === 'email' && (
              <FormField
                label="Email"
                value={email}
                onChangeText={setEmail}
                onBlur={() => touch('email')}
                placeholder="name@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                error={emailError}
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
                error={otpError}
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
                  error={passwordError}
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
                  error={confirmError}
                  hint={HINTS.confirm}
                />
              </>
            )}

            {serverError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBoxText}>{serverError}</Text>
              </View>
            )}

            <Button
              title={
                step === 'email' ? 'Send Code' : step === 'otp' ? 'Verify Code' : 'Reset Password'
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
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorSoft,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
});
