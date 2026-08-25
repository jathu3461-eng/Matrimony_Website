import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';

interface StepIndicatorProps {
  steps: Array<{ key: string; title: string; hint: string; icon: string }>;
  current: number;
  maxReachable: number;
  validSteps: boolean[];
  onStepClick: (index: number) => void;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  person: 'person',
  school: 'school',
  resize: 'resize',
  heart: 'heart',
  wallet: 'wallet',
  library: 'library',
  star: 'star',
  location: 'location',
  camera: 'camera',
  'document-text': 'document-text',
};

export function StepIndicator({
  steps,
  current,
  maxReachable,
  validSteps,
  onStepClick,
}: StepIndicatorProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {steps.map((step, i) => {
        const isActive = i === current;
        const isDone = validSteps[i];
        const isReachable = i <= maxReachable;

        return (
          <Pressable
            key={step.key}
            onPress={() => isReachable && onStepClick(i)}
            disabled={!isReachable}
            style={[
              styles.chip,
              {
                borderColor: isActive
                  ? colors.primary
                  : isReachable
                    ? colors.borderStrong
                    : colors.border,
                backgroundColor: isActive
                  ? colors.primary
                  : colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isDone
                    ? colors.success
                    : isActive
                      ? colors.white
                      : colors.border,
                },
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={10} color={colors.white} />
              ) : (
                <Text
                  style={[
                    styles.dotText,
                    {
                      color: isActive ? colors.primary : colors.inkFaint,
                    },
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isActive
                    ? colors.white
                    : isReachable
                      ? colors.inkSoft
                      : colors.inkFaint,
                },
              ]}
              numberOfLines={1}
            >
              {step.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
});
