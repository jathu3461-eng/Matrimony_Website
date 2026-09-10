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
import { extractError } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/authSlice';
import { validateEmailOrPhone, validatePassword, fieldError } from '@/utils/validation';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { status, error } = useAppSelector((s) => s.auth);
  const loading = status === 'loading';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const errors = useMemo(
    () => ({
      email: fieldError(email, touched.email, validateEmailOrPhone),
      password: fieldError(password, touched.password, validatePassword),
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
      setServerError(extractError(err, t('error')));
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
            <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
              <Ionicons name="heart" size={32} color={colors.white} />
            </View>
            <Text style={[styles.brand, { color: colors.primary }]}>{t('appName')}</Text>
            <Text style={[styles.tagline, { color: colors.inkSoft }]}>
              {t('tagline')}
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
            <Text style={[styles.welcome, { color: colors.ink }]}>{t('loginTitle')}</Text>
            <Text style={[styles.hint, { color: colors.inkFaint }]}>
              {t('loginSub')}
            </Text>

            <FormField
              label={t('emailOrMobile')}
              value={email}
              onChangeText={setEmail}
              onBlur={() => touch('email')}
              placeholder={t('emailPlaceholder')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
              hint={t('errEmailOrMobile')}
            />
            <FormField
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              onBlur={() => touch('password')}
              placeholder={t('passwordPlaceholder')}
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

            <Button title={t('loginButton')} onPress={submit} loading={loading} size="lg" />
          </View>

          <View style={styles.footer}>
            <Button
              title={t('forgotPassword')}
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('ForgotPassword')}
            />
            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: colors.inkSoft }]}>{t('noAccount')} </Text>
              <Button
                title={t('createAccount')}
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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
});
