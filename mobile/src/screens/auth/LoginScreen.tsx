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
import { extractError } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/authSlice';
import { colors, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);
  const loading = status === 'loading';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const emailError = touched.email && !email.trim() ? 'Email or phone is required' : null;
  const passwordError = touched.password && !password ? 'Password is required' : null;

  const submit = async () => {
    setTouched({ email: true, password: true });
    if (!email.trim() || !password) return;

    setServerError(null);
    try {
      await dispatch(login({ email: email.trim(), password })).unwrap();
    } catch (err) {
      setServerError(extractError(err, 'Unable to log in. Please try again.'));
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
              <Ionicons name="heart" size={32} color={colors.white} />
            </View>
            <Text style={styles.brand}>Mukurtham</Text>
            <Text style={styles.tagline}>Matrimony, made meaningful</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.hint}>Sign in to continue your journey</Text>

            <FormField
              label="Email or phone"
              value={email}
              onChangeText={setEmail}
              onBlur={() => touch('email')}
              placeholder="you@example.com or +91..."
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={emailError}
              hint="Enter your registered email or phone"
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              onBlur={() => touch('password')}
              placeholder="Your password"
              secure
              autoCapitalize="none"
              onSubmitEditing={submit}
              error={passwordError}
            />

            {(serverError || error) && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBoxText}>{serverError || error}</Text>
              </View>
            )}

            <Button title="Log In" onPress={submit} loading={loading} size="lg" />
          </View>

          <View style={styles.footer}>
            <Button
              title="Forgot password?"
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('ForgotPassword')}
            />
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>New here? </Text>
              <Button
                title="Create account"
                variant="ghost"
                size="sm"
                titleStyle={{ fontWeight: '700' }}
                onPress={() => navigation.navigate('Register')}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
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
  welcome: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.inkFaint,
    marginBottom: spacing.lg,
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
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  signupText: {
    ...typography.body,
    color: colors.inkSoft,
  },
});
