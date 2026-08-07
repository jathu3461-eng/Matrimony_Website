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
import { colors, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
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
            <Image source={{ uri: uploadsUrl(primary.main_profile_picture) }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color={colors.inkFaint} />
            </View>
          )}
          <Text style={styles.username}>{user?.username ?? 'Member'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role ?? 'regular'}</Text>
            </View>
            {user?.is_approved === 1 && (
              <View style={[styles.roleBadge, styles.approvedBadge]}>
                <Text style={[styles.roleText, styles.approvedText]}>Approved</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>My profiles</Text>
        {myProfiles.data && myProfiles.data.length > 0 ? (
          myProfiles.data.map((p) => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [styles.profileRow, pressed && styles.pressed]}
              onPress={() => navigation.navigate('ProfileDetail', { profileId: p.id })}
            >
              <Text style={styles.profileName}>{p.name}</Text>
              <Text style={styles.profileMeta}>
                {p.age} yrs · {p.status} {p.is_verified === 1 ? '· Verified' : ''}
              </Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.noProfile}>
            <Text style={styles.noProfileText}>
              You haven't created a profile yet.
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
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Settings')}
          />
          <Button
            title="Log Out"
            variant="danger"
            size="md"
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
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    ...typography.title,
    color: colors.ink,
  },
  email: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  roleBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  roleText: {
    ...typography.label,
    color: colors.primaryDark,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  approvedBadge: {
    backgroundColor: colors.successSoft,
  },
  approvedText: {
    color: colors.success,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.inkFaint,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  profileRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  profileName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ink,
  },
  profileMeta: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  noProfile: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noProfileText: {
    ...typography.body,
    color: colors.inkFaint,
    textAlign: 'center',
    marginBottom: spacing.md,
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
