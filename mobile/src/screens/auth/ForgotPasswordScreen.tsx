import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';
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
  const [error, setError] = useState<string | undefined>(undefined);

  const requestOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await authApi.requestForgotOtp(email.trim());
      setStep('otp');
    } catch (err) {
      setError(extractError(err, 'Could not send code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.trim().length < 4) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await authApi.verifyForgotOtp(email.trim(), otp.trim());
      setStep('password');
    } catch (err) {
      setError(extractError(err, 'Invalid code. Please check and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(newPassword)) {
      setError('Password: min 8 chars, 1 uppercase, 1 special character.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      Alert.alert('Password reset', 'You can now log in with your new password.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (err) {
      setError(extractError(err, 'Could not reset password. Please try again.'));
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
          <Text style={styles.title}>Reset your password</Text>

          {step === 'email' && (
            <>
              <Text style={styles.hint}>
                Enter your account email and we'll send you a 6-digit verification code.
              </Text>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.hint}>
                We sent a 6-digit code to {email.trim()}. Enter it below.
              </Text>
              <Input
                label="Verification code"
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
              />
            </>
          )}

          {step === 'password' && (
            <>
              <Text style={styles.hint}>Code verified. Choose a new password.</Text>
              <Input
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 8 chars, 1 uppercase, 1 special"
                secure
                autoCapitalize="none"
              />
              <Input
                label="Confirm new password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                secure
                autoCapitalize="none"
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title={
              step === 'email' ? 'Send Code' : step === 'otp' ? 'Verify Code' : 'Reset Password'
            }
            onPress={step === 'email' ? requestOtp : step === 'otp' ? verifyOtp : resetPassword}
            loading={loading}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.body,
    color: colors.inkSoft,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
