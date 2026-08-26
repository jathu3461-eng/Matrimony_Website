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
import { extractError } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/authSlice';
import { validateEmailOrPhone, validateLoginPassword, fieldError } from '@/utils/validation';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { status, error } = useAppSelector((s) => s.auth);
  const loading = status === 'loading';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const errors = useMemo(
    () => ({
      email: fieldError(email, touched.email, validateEmailOrPhone),
      password: fieldError(password, touched.password, validateLoginPassword),
    }),
    [email, password, touched]
  );

  const submit = async () => {
    setTouched({ email: true, password: true });
    if (errors.email || errors.password) return;

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AnimatedLogo shape="squircle" size={120} />
            <Text style={[styles.brand, { color: colors.primary }]}>Mukurtham</Text>
            <Text style={[styles.tagline, { color: colors.inkSoft }]}>
              Matrimony, made meaningful
            </Text>
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
            <Text style={[styles.welcome, { color: colors.ink }]}>Welcome back</Text>
            <Text style={[styles.hint, { color: colors.inkFaint }]}>
              Sign in to continue your journey
            </Text>

            <FormField
              label="Email or phone"
              value={email}
              onChangeText={setEmail}
              onBlur={() => touch('email')}
              placeholder="you@example.com or +91..."
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
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
              error={errors.password}
            />

            {(serverError || error) && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[styles.errorBoxText, { color: colors.error }]}>
                  {serverError || error}
                </Text>
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
              <Text style={[styles.signupText, { color: colors.inkSoft }]}>New here? </Text>
              <Button
                title="Create account"
                variant="ghost"
                size="sm"
                titleStyle={{ fontWeight: '700' }}
                onPress={() => navigation.navigate('Register')}
              />
            </View>
            <View style={[styles.secureBadge, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text style={[styles.secureText, { color: colors.success }]}>Secure & Private</Text>
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
  brand: {
    fontSize: 28,
    fontWeight: '800',
  },
  tagline: {
    ...typography.caption,
    marginTop: 2,
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
  welcome: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    marginBottom: spacing.lg,
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
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  signupText: {
    ...typography.body,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  secureText: {
    ...typography.label,
    fontWeight: '700',
  },
});
