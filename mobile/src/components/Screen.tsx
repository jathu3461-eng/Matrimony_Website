import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
}

export function Screen({ style, children, ...rest }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'bottom']}>
      <View style={styles.inner} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
});
