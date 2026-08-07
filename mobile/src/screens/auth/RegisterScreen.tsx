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
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/authSlice';
import {
  validateUsername,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  HINTS,
} from '@/utils/validation';
import { colors, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'regular' | 'broker'>('regular');
  const [businessName, setBusinessName] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const errors = useMemo(
    () => ({
      username: touched.username ? validateUsername(username) : null,
      email: touched.email ? validateEmail(email) : null,
      phone: touched.phone ? validatePhone(phone) : null,
      password: touched.password ? validatePassword(password) : null,
      confirm: touched.confirm ? validateConfirmPassword(password, confirm) : null,
      businessName:
        role === 'broker' && touched.businessName
          ? businessName.trim().length < 2
            ? 'Business name is required (min 2 characters)'
            : null
          : null,
    }),
    [username, email, phone, password, confirm, role, businessName, touched]
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
    if (hasErrors) return;

    setServerError(null);
    setLoading(true);
    try {
      const result = await authApi.signup({
        username: username.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        password,
        role,
        ...(role === 'broker' ? { business_name: businessName.trim() } : {}),
      });
      if (result.status === 'pending_approval') {
        setServerError(null);
        alert('Account created! Waiting for admin approval.');
        navigation.navigate('Login');
        return;
      }
      // Navigate to OTP verification
      navigation.navigate('VerifyOTP', {
        email: email.trim(),
        password,
        username: username.trim(),
        phone: phone.trim(),
        role,
        ...(role === 'broker' ? { businessName: businessName.trim() } : {}),
      });
    } catch (err) {
      setServerError(extractError(err, 'Unable to create account.'));
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Ionicons name="heart" size={24} color={colors.white} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journey to find the perfect match</Text>
          </View>

          <View style={styles.card}>
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
              label="Username"
              value={username}
              onChangeText={setUsername}
              onBlur={() => touch('username')}
              placeholder="e.g. john_95"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username}
              hint={HINTS.username}
            />
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              onBlur={() => touch('email')}
              placeholder="e.g. john@gmail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
              hint={HINTS.email}
            />
            <FormField
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              onBlur={() => touch('phone')}
              placeholder="e.g. +919876543210"
              keyboardType="phone-pad"
              error={errors.phone}
              hint={HINTS.phone}
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              onBlur={() => touch('password')}
              placeholder="Create a strong password"
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

            {role === 'broker' && (
              <FormField
                label="Business name"
                value={businessName}
                onChangeText={setBusinessName}
                onBlur={() => touch('businessName')}
                placeholder="Your agency name"
                error={errors.businessName}
                hint={HINTS.businessName}
              />
            )}

            {serverError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBoxText}>{serverError}</Text>
              </View>
            )}

            <Button title="Create Account" onPress={submit} loading={loading} size="lg" />
          </View>

          <View style={styles.footer}>
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Button
                title="Log in"
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  footer: {
    alignItems: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
    color: colors.inkSoft,
  },
});
