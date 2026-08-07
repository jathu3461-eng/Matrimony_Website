import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadsUrl } from '@/api/client';
import { interestApi } from '@/api/interests';
import { colors, radius, spacing, typography } from '@/theme';
import type { Interest } from '@/types';

interface InterestRowProps {
  interest: Interest;
  direction: 'received' | 'sent';
  onPress?: () => void;
  onResponded?: () => void;
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: 'Pending', color: colors.warning },
  accepted: { text: 'Accepted', color: colors.success },
  rejected: { text: 'Declined', color: colors.error },
  declined: { text: 'Declined', color: colors.error },
};

export function InterestRow({ interest, direction, onPress, onResponded }: InterestRowProps) {
  const otherName = direction === 'received' ? interest.sender_name : interest.receiver_name;
  const otherPic = direction === 'received' ? interest.sender_pic : interest.receiver_pic;
  const status = STATUS_LABEL[interest.status];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {otherPic ? (
        <Image source={{ uri: uploadsUrl(otherPic) }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={22} color={colors.inkFaint} />
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.name}>{otherName ?? 'Profile'}</Text>
        {interest.message ? (
          <Text style={styles.message} numberOfLines={1}>
            {interest.message}
          </Text>
        ) : (
          <Text style={styles.message} numberOfLines={1}>
            {direction === 'received' ? 'Sent you an interest' : 'You sent an interest'}
          </Text>
        )}
        {interest.occupation ? (
          <Text style={styles.meta}>{interest.occupation}</Text>
        ) : null}
      </View>

      {interest.status === 'pending' && direction === 'received' ? (
        <View style={styles.actions}>
          <Pressable
            onPress={async () => {
              await interestApi.respond(interest.id, 'accepted');
              onResponded?.();
            }}
            style={styles.acceptBtn}
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </Pressable>
          <Pressable
            onPress={async () => {
              await interestApi.respond(interest.id, 'rejected');
              onResponded?.();
            }}
            style={styles.rejectBtn}
          >
            <Ionicons name="close" size={18} color={colors.error} />
          </Pressable>
        </View>
      ) : (
        status && <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ink,
  },
  message: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  meta: {
    ...typography.label,
    color: colors.inkFaint,
    marginTop: 2,
  },
  status: {
    ...typography.label,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
