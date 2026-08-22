import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/authSlice';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type OtpRoute = RouteProp<AuthStackParamList, 'VerifyOTP'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function VerifyOTPScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<OtpRoute>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { email, password, otpSent } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Signup only marks the code as sent when the email actually went out.
  // If it didn't (or this screen was opened directly), request it now.
  useEffect(() => {
    if (otpSent) return;
    authApi.requestSignupOtp(email).catch((err) => {
      setServerError(extractError(err, 'Could not send the code. Tap "Resend code" to try again.'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (serverError) setServerError(null);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setServerError('Please enter the complete 6-digit code');
      return;
    }

    setServerError(null);
    setLoading(true);
    try {
      // Verify OTP then login
      await authApi.verifySignupOtp(email, code);
      setSuccess(true);
      // Auto-login after successful verification
      setTimeout(async () => {
        try {
          await dispatch(login({ email, password })).unwrap();
        } catch {
          navigation.navigate('Login');
        }
      }, 1500);
    } catch (err) {
      setServerError(extractError(err, 'Invalid or expired code.'));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setServerError(null);
    try {
      await authApi.requestSignupOtp(email);
      setCooldown(RESEND_COOLDOWN);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setServerError(extractError(err, 'Could not resend code.'));
    }
  };

  if (success) {
    return (
      <Screen>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.success }]}>Verified!</Text>
          <Text style={[styles.successHint, { color: colors.inkSoft }]}>
            Your account has been verified successfully
          </Text>
        </View>
      </Screen>
    );
  }

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
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="mail-open-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.ink }]}>Verify your email</Text>
            <Text style={[styles.subtitle, { color: colors.inkSoft }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={[styles.email, { color: colors.ink }]}>{email}</Text>
            </Text>
          </View>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[
                  styles.otpBox,
                  { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink },
                  digit && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                ]}
                value={digit}
                onChangeText={(t) => handleOtpChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={i === 0 ? OTP_LENGTH : 1}
                selectTextOnFocus
              />
            ))}
          </View>

          {serverError && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{serverError}</Text>
            </View>
          )}

          <Button title="Verify" onPress={verify} loading={loading} size="lg" />

          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.inkSoft }]}>
              Didn't receive the code?{' '}
            </Text>
            <Pressable onPress={resend} disabled={cooldown > 0}>
              <Text
                style={[
                  styles.resendLink,
                  { color: cooldown > 0 ? colors.inkFaint : colors.primary },
                ]}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </Text>
            </Pressable>
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
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  email: {
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  errorText: {
    ...typography.caption,
    flex: 1,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendLabel: {
    ...typography.body,
  },
  resendLink: {
    ...typography.body,
    fontWeight: '700',
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.display,
    marginBottom: spacing.xs,
  },
  successHint: {
    ...typography.body,
    textAlign: 'center',
  },
});
