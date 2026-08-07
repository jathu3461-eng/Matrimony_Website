import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
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
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  const submit = async () => {
    if (!email.trim() || !password) {
      setFieldError('Enter your email and password');
      return;
    }
    setFieldError(undefined);
    try {
      await dispatch(login({ email: email.trim(), password })).unwrap();
    } catch (err) {
      setFieldError(extractError(err, 'Unable to log in. Please try again.'));
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
        >
          <Text style={styles.brand}>Mukurtham</Text>
          <Text style={styles.subtitle}>Welcome back</Text>

          <View style={styles.form}>
            <Input
              label="Email or phone"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com or +91..."
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secure
              autoCapitalize="none"
              onSubmitEditing={submit}
            />

            {(fieldError || error) && (
              <Text style={styles.error}>{fieldError || error}</Text>
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
            <Button
              title="Create an account"
              variant="outline"
              size="md"
              onPress={() => navigation.navigate('Register')}
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
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brand: {
    ...typography.display,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.md,
  },
  footer: {
    gap: spacing.sm,
    alignItems: 'center',
  },
});
