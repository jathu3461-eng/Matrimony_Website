import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadsUrl } from '@/api/client';
import { colors, radius, spacing, typography } from '@/theme';
import type { Profile } from '@/types';

interface ProfileCardProps {
  profile: Profile;
  onPress?: () => void;
}

export function ProfileCard({ profile, onPress }: ProfileCardProps) {
  const photoUrl = uploadsUrl(profile.main_profile_picture);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="person" size={36} color={colors.inkFaint} />
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.name}>
          {profile.name}
          {profile.is_verified === 1 && (
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
          )}
        </Text>
        <Text style={styles.meta}>
          {profile.age} yrs · {profile.height_feet}'{profile.height_inches ?? 0}"
        </Text>
        <Text style={styles.meta}>{profile.occupation || 'Occupation not listed'}</Text>
        {profile.city_or_state && <Text style={styles.meta}>{profile.city_or_state}</Text>}
        {profile.interest_status === 'pending' && (
          <Text style={styles.pending}>Interest pending</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 1,
  },
  pending: {
    ...typography.label,
    color: colors.warning,
    marginTop: 4,
    fontWeight: '700',
  },
});
