import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadsUrl } from '@/api/client';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { Profile } from '@/types';

interface ProfileCardProps {
  profile: Profile;
  onPress?: () => void;
}

export function ProfileCard({ profile, onPress }: ProfileCardProps) {
  const { colors } = useTheme();
  const photoUrl = uploadsUrl(profile.main_profile_picture);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.photoWrap}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={[styles.photo, { backgroundColor: colors.primarySoft }]} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="person" size={32} color={colors.inkFaint} />
          </View>
        )}
        {profile.is_verified === 1 && (
          <View style={[styles.verifiedDot, { backgroundColor: colors.success, borderColor: colors.surface }]}>
            <Ionicons name="shield-checkmark" size={12} color={colors.white} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
            {profile.name}
          </Text>
          {profile.age && <Text style={[styles.age, { color: colors.inkFaint }]}>{profile.age}</Text>}
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="resize-outline" size={13} color={colors.inkFaint} />
          <Text style={[styles.meta, { color: colors.inkSoft }]}>
            {profile.height_feet}'{profile.height_inches ?? 0}"
          </Text>
        </View>

        {profile.occupation ? (
          <View style={styles.metaRow}>
            <Ionicons name="briefcase-outline" size={13} color={colors.inkFaint} />
            <Text style={[styles.meta, { color: colors.inkSoft }]} numberOfLines={1}>
              {profile.occupation}
            </Text>
          </View>
        ) : null}

        {profile.city_or_state ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.inkFaint} />
            <Text style={[styles.meta, { color: colors.inkSoft }]} numberOfLines={1}>
              {profile.city_or_state}
            </Text>
          </View>
        ) : null}

        {profile.interest_status === 'pending' && (
          <View style={styles.pendingBadge}>
            <Text style={[styles.pendingText, { color: colors.warning }]}>Interest pending</Text>
          </View>
        )}
        {profile.interest_status === 'accepted' && (
          <View style={[styles.pendingBadge, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.pendingText, { color: colors.success }]}>Matched</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    flex: 1,
  },
  age: {
    ...typography.caption,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  meta: {
    ...typography.caption,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  pendingText: {
    ...typography.label,
    fontWeight: '700',
  },
});
