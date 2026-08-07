import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { authApi } from '@/api/auth';
import { extractError } from '@/api/client';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/authSlice';
import { colors, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'regular' | 'broker'>('regular');
  const [businessName, setBusinessName] = useState('');
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const validate = (): string | null => {
    if (username.trim().length < 4) return 'Username must be at least 4 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return 'Username: letters, numbers and underscore only.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) return 'Phone must be in international format, e.g. +14165550198.';
    if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password))
      return 'Password: min 8 chars, 1 uppercase, 1 special character.';
    if (password !== confirm) return 'Passwords do not match.';
    if (role === 'broker' && businessName.trim().length < 2) return 'Business name is required for broker accounts.';
    return null;
  };

  const submit = async () => {
    const invalid = validate();
    if (invalid) {
      setFormError(invalid);
      return;
    }
    setFormError(undefined);
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
        setFormError(undefined);
        alert('Account created! Waiting for admin approval.');
        navigation.navigate('Login');
        return;
      }
      await dispatch(login({ email: email.trim(), password })).unwrap();
    } catch (err) {
      setFormError(extractError(err, 'Unable to create account. Please try again.'));
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
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Ionicons name="heart" size={24} color={colors.white} />
            </View>
            <Text style={styles.title}>Create your account</Text>
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

            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="4-30 letters, numbers, underscore"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+14165550198"
              keyboardType="phone-pad"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 chars, 1 uppercase, 1 special"
              secure
              autoCapitalize="none"
            />
            <Input
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              secure
              autoCapitalize="none"
            />
            {role === 'broker' && (
              <Input
                label="Business name"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Your agency name"
              />
            )}

            {formError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.error}>{formError}</Text>
              </View>
            )}

            <Button title="Sign Up" onPress={submit} loading={loading} size="lg" />
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
  error: {
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
