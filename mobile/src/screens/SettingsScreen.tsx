import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { colors, radius, spacing, typography } from '@/theme';

export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const user = useAppSelector((s) => s.auth.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Row icon="person" label="Username" value={user?.username} />
          <Row icon="mail" label="Email" value={user?.email} />
          <Row icon="call" label="Phone" value={user?.phone_number} />
          <Row icon="shield-checkmark" label="Role" value={user?.role} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App</Text>
          <Row icon="globe" label="Language" value={user?.ui_language === 'ta' ? 'Tamil' : 'English'} />
          <Row icon="information-circle" label="Version" value="1.0.0" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Privacy</Text>
          <Text style={styles.privacyNote}>
            Your data is stored securely and never shared with third parties. Profile photos are
            only visible to other registered users.
          </Text>
        </View>

        <Button
          title="Log Out"
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

function Row({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  return (
    <View style={rowStyles.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.inkSoft} />
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value || '—'}</Text>
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
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.body,
    color: colors.inkSoft,
    minWidth: 90,
  },
  value: {
    ...typography.body,
    color: colors.ink,
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
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.inkFaint,
    marginBottom: spacing.sm,
  },
  privacyNote: {
    ...typography.caption,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  logoutBtn: {
    marginTop: spacing.lg,
  },
});
