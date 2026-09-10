import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { useTheme, ThemeMode } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import { useI18n, Language } from '@/i18n';

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Light', value: 'light', icon: 'sunny' },
  { label: 'Dark', value: 'dark', icon: 'moon' },
  { label: 'System', value: 'system', icon: 'phone-portrait' },
];

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const user = useAppSelector((s) => s.auth.user);
  const { colors, mode, setMode } = useTheme();
  const { t, lang, setLang } = useI18n();
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    Alert.alert(t('logOut'), t('ok'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logOut'),
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await dispatch(logout());
          setLoggingOut(false);
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.ink }]}>{t('settings')}</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>{t('preferredLanguage')}</Text>
          <View style={styles.themeRow}>
            <Pressable
              style={[
                styles.themeBtn,
                {
                  backgroundColor: lang === 'en' ? colors.primary : colors.surface,
                  borderColor: lang === 'en' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setLang('en')}
            >
              <Ionicons
                name="globe"
                size={18}
                color={lang === 'en' ? colors.white : colors.inkSoft}
              />
              <Text
                style={[
                  styles.themeBtnText,
                  { color: lang === 'en' ? colors.white : colors.inkSoft },
                ]}
              >
                {t('languageEnglish')}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.themeBtn,
                {
                  backgroundColor: lang === 'ta' ? colors.primary : colors.surface,
                  borderColor: lang === 'ta' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setLang('ta')}
            >
              <Ionicons
                name="globe"
                size={18}
                color={lang === 'ta' ? colors.white : colors.inkSoft}
              />
              <Text
                style={[
                  styles.themeBtnText,
                  { color: lang === 'ta' ? colors.white : colors.inkSoft },
                ]}
              >
                {t('languageTamil')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>Account</Text>
          <Row icon="person" label={t('username')} value={user?.username} colors={colors} />
          <Row icon="mail" label={t('emailLabel')} value={user?.email} colors={colors} />
          <Row icon="call" label={t('mobileLabel')} value={user?.phone_number} colors={colors} />
          <Row icon="shield-checkmark" label="Role" value={user?.role} colors={colors} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>Appearance</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: mode === opt.value ? colors.primary : colors.surface,
                    borderColor: mode === opt.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMode(opt.value)}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={mode === opt.value ? colors.white : colors.inkSoft}
                />
                <Text
                  style={[
                    styles.themeBtnText,
                    { color: mode === opt.value ? colors.white : colors.inkSoft },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>App</Text>
          <Row icon="globe" label={t('preferredLanguage')} value={lang === 'ta' ? t('languageTamil') : t('languageEnglish')} colors={colors} />
          <Row icon="phone-portrait" label="Platform" value={Platform.OS === 'ios' ? 'iOS' : 'Android'} colors={colors} />
          <Row icon="information-circle" label="Version" value="1.0.0" colors={colors} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.inkFaint }]}>Privacy</Text>
          <Row icon="lock-closed" label="Security" value={t('encryptedNote')} colors={colors} />
          <Row icon="eye-off" label="Visibility" value="Members only" colors={colors} />
          <Text style={[styles.privacyNote, { color: colors.inkSoft }]}>
            {t('encryptedNote')}
          </Text>
        </View>

        <Button
          title={t('logOut')}
          variant="danger"
          size="lg"
          loading={loggingOut}
          onPress={doLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </Screen>
  );
}

function Row({ icon, label, value, colors }: { icon: string; label: string; value?: string | null; colors: any }) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.inkSoft} />
      <Text style={[rowStyles.label, { color: colors.inkSoft }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.ink }]}>{value || '—'}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    ...typography.body,
    minWidth: 90,
  },
  value: {
    ...typography.body,
    flex: 1,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  themeBtnText: {
    ...typography.caption,
    fontWeight: '700',
  },
  privacyNote: {
    ...typography.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  logoutBtn: {
    marginTop: spacing.lg,
  },
});
