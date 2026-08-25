import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';

interface ProgressBarProps {
  value: number; // 0–100
  style?: ViewStyle;
}

export function ProgressBar({ value, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: colors.inkSoft }]}>
        {clamped}% complete
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    ...typography.label,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});
