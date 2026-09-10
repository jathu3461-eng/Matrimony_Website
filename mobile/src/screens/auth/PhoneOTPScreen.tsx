import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { radius, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'PhoneOTP'>;
type Route = RouteProp<AuthStackParamList, 'PhoneOTP'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function PhoneOTPScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { phone, email, password, username, role, businessName } = route.params;

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newCode[index + i] = d;
      });
      setCode(newCode);
      const nextIdx = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIdx]?.focus();
      return;
    }
    const digit = text.replace(/\D/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpStr = code.join('');
    if (otpStr.length < OTP_LENGTH) {
      setError(t('otpInvalidCode'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Verify the phone OTP first (pre-signup), then create the account.
      await authApi.verifyPhoneOtp(phone, otpStr);
      await authApi.signup({
        username,
        email,
        password,
        phone_number: phone,
        role,
        business_name: businessName,
      });
      setSuccess(true);
      // Auto-navigate to login after short delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      setError(extractError(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    try {
      await authApi.sendPhoneOtp(phone);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(extractError(err, 'Failed to resend code'));
    }
  };

  if (success) {
    return (
      <Screen>
        <View style={styles.centerContent}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.ink }]}>{t('otpSuccess')}</Text>
          {role === 'broker' && (
            <>
              <Text style={[styles.brokerPendingTitle, { color: colors.ink }]}>{t('brokerPendingTitle')}</Text>
              <Text style={[styles.brokerPendingText, { color: colors.inkSoft }]}>
                {t('brokerPendingDesc')}
              </Text>
              <Text style={[styles.brokerPendingNote, { color: colors.primary }]}>
                {t('brokerPendingNote')}
              </Text>
            </>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.ink }]}>{t('otpTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.inkSoft }]}>
            {t('otpSubtitle')}{' '}
            <Text style={{ fontWeight: '700', color: colors.ink }}>{phone}</Text>
          </Text>

          <View style={styles.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[
                  styles.otpBox,
                  {
                    color: colors.ink,
                    borderColor: digit ? colors.primary : colors.border,
                    backgroundColor: digit ? colors.primarySoft : colors.surface,
                  },
                ]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={i === 0 ? OTP_LENGTH : 1}
                textContentType="oneTimeCode"
                autoFocus={i === 0}
              />
            ))}
          </View>

          {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

          <Button
            title={loading ? t('otpVerifying') : t('otpVerify')}
            onPress={verifyOtp}
            loading={loading}
            size="lg"
          />

          <View style={styles.resendRow}>
            <Text style={[styles.resendText, { color: colors.inkFaint }]}>
              {cooldown > 0
                ? `${t('otpResend')} ${cooldown}s`
                : t('otpDidntReceive')}
            </Text>
            {cooldown <= 0 && (
              <Pressable onPress={resendCode}>
                <Text style={[styles.resendBtn, { color: colors.primary }]}>{t('otpResendBtn')}</Text>
              </Pressable>
            )}
          </View>

          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.inkFaint} />
            <Text style={[styles.backText, { color: colors.inkFaint }]}>{t('backToLogin')}</Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: { ...typography.display, fontSize: 26, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.xl, lineHeight: 22 },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  error: { ...typography.caption, fontWeight: '600', textAlign: 'center', marginBottom: spacing.md },
  successTitle: { ...typography.title, fontSize: 20, fontWeight: '700' },
  brokerPendingTitle: { ...typography.title, fontSize: 18, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  brokerPendingText: { ...typography.body, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  brokerPendingNote: { ...typography.label, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  resendText: { ...typography.body },
  resendBtn: { ...typography.body, fontWeight: '700' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  backText: { ...typography.body },
});
