import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '@/api/profiles';
import { uploadsUrl } from '@/api/client';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { colors } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const myProfiles = useQuery({
    queryKey: ['my-profiles'],
    queryFn: () => profileApi.mine(),
  });

  const doLogout = async () => {
    setLoggingOut(true);
    await dispatch(logout());
    setLoggingOut(false);
  };

  const primary = myProfiles.data?.[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {primary?.main_profile_picture ? (
            <Image source={{ uri: uploadsUrl(primary.main_profile_picture) }} style={[styles.avatar, { backgroundColor: colors.primarySoft }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="person" size={40} color={colors.inkFaint} />
            </View>
          )}
          <Text style={[styles.username, { color: colors.ink }]}>{user?.username ?? 'Member'}</Text>
          <Text style={[styles.email, { color: colors.inkSoft }]}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.roleText, { color: colors.primaryDark }]}>{user?.role ?? 'regular'}</Text>
            </View>
            {user?.is_approved === 1 && (
              <View style={[styles.roleBadge, styles.approvedBadge, { backgroundColor: colors.successSoft }]}>
                <Text style={[styles.roleText, styles.approvedText, { color: colors.success }]}>Approved</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.inkFaint }]}>My profiles</Text>
        {myProfiles.data && myProfiles.data.length > 0 ? (
          myProfiles.data.map((p) => (
            <Pressable
              key={`myprofile-${p.id}`}
              style={({ pressed }) => [
                styles.profileRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
              onPress={() => navigation.navigate('ProfileDetail', { profileId: p.id })}
            >
              <Text style={[styles.profileName, { color: colors.ink }]}>{p.name}</Text>
              <Text style={[styles.profileMeta, { color: colors.inkSoft }]}>
                {p.age} yrs · {p.status} {p.is_verified === 1 ? '· Verified' : ''}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.noProfile}>
            <Ionicons name="person-add-outline" size={40} color={colors.inkFaint} />
            <Text style={[styles.noProfileText, { color: colors.inkFaint }]}>
              You haven't created a profile yet
            </Text>
            <Button
              title="Create Profile"
              size="md"
              style={styles.noProfileBtn}
              onPress={() => navigation.navigate('CreateProfile')}
            />
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Settings"
            variant="outline"
            size="md"
            leftIcon="settings-outline"
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Settings')}
          />
          <Button
            title="Log Out"
            variant="danger"
            size="md"
            leftIcon="log-out-outline"
            style={styles.actionBtn}
            loading={loggingOut}
            onPress={doLogout}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    ...typography.title,
  },
  email: {
    ...typography.caption,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  roleBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  roleText: {
    ...typography.label,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  approvedBadge: {},
  approvedText: {},
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  profileRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  profileName: {
    ...typography.body,
    fontWeight: '700',
  },
  profileMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  noProfile: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  noProfileText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noProfileBtn: {
    alignSelf: 'stretch',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
});
