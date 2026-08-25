import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadsUrl } from '@/api/client';
import { interestApi } from '@/api/interests';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { Interest } from '@/types';

interface InterestRowProps {
  interest: Interest;
  direction: 'received' | 'sent';
  onPress?: () => void;
  onResponded?: () => void;
}

export function InterestRow({ interest, direction, onPress, onResponded }: InterestRowProps) {
  const { colors } = useTheme();
  const otherName = direction === 'received' ? interest.sender_name : interest.receiver_name;
  const otherPic = direction === 'received' ? interest.sender_pic : interest.receiver_pic;

  const STATUS_LABEL: Record<string, { text: string; color: string }> = {
    pending: { text: 'Pending', color: colors.warning },
    accepted: { text: 'Accepted', color: colors.success },
    rejected: { text: 'Declined', color: colors.error },
    declined: { text: 'Declined', color: colors.error },
  };
  const status = STATUS_LABEL[interest.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      {otherPic ? (
        <Image source={{ uri: uploadsUrl(otherPic) }} style={[styles.avatar, { backgroundColor: colors.primarySoft }]} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="person" size={22} color={colors.inkFaint} />
        </View>
      )}

      <View style={styles.details}>
        <Text style={[styles.name, { color: colors.ink }]}>{otherName ?? 'Profile'}</Text>
        <Text style={[styles.message, { color: colors.inkSoft }]} numberOfLines={1}>
          {interest.message ||
            (direction === 'received' ? 'Sent you an interest' : 'You sent an interest')}
        </Text>
        {interest.occupation ? (
          <Text style={[styles.meta, { color: colors.inkFaint }]}>{interest.occupation}</Text>
        ) : null}
      </View>

      {interest.status === 'pending' && direction === 'received' ? (
        <View style={styles.actions}>
          <Pressable
            onPress={async () => {
              await interestApi.respond(interest.id, 'accepted');
              onResponded?.();
            }}
            style={[styles.acceptBtn, { backgroundColor: colors.successSoft }]}
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </Pressable>
          <Pressable
            onPress={async () => {
              await interestApi.respond(interest.id, 'rejected');
              onResponded?.();
            }}
            style={[styles.rejectBtn, { backgroundColor: colors.errorSoft }]}
          >
            <Ionicons name="close" size={18} color={colors.error} />
          </Pressable>
        </View>
      ) : interest.status === 'accepted' ? (
        <Pressable onPress={onPress} style={[styles.viewBtn, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="person-outline" size={16} color={colors.primary} />
          <Text style={[styles.viewBtnText, { color: colors.primary }]}>View</Text>
        </Pressable>
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
    borderRadius: radius.md,
    borderWidth: 1,
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
  },
  message: {
    ...typography.caption,
    marginTop: 2,
  },
  meta: {
    ...typography.label,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewBtnText: {
    ...typography.label,
    fontWeight: '700',
  },
});
