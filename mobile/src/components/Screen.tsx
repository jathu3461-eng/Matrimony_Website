import { StyleSheet, View, ViewProps } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  edges?: Edge[];
}

export function Screen({ style, children, edges, ...rest }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }, style]} edges={edges ?? ['top', 'bottom']}>
      <View style={styles.inner} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
