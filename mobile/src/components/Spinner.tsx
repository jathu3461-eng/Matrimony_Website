import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { spacing } from '@/theme';
import { useI18n } from '@/i18n';

export function Spinner({ label }: { label?: string }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
});
