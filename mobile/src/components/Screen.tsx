import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type Edge = 'top' | 'bottom' | 'left' | 'right';

interface ScreenProps extends ViewProps {
  edges?: Edge[];
  /** For tab screens: only top safe area, bottom handled by tab bar */
  tabScreen?: boolean;
  /** For screens with their own custom header inside the content */
  customHeader?: boolean;
}

/**
 * Global screen container. Handles safe area centrally.
 *
 * - `tabScreen`: bottom safe area is NOT applied (tab bar handles it).
 *   Content scroll padding for the tab bar is NOT added here — each screen's
 *   scroll container should use a consistent bottom padding from the layout tokens.
 *
 * - Stack screens (default): both top and bottom safe areas are applied.
 *
 * - `customHeader`: if true, only applies top safe area (the screen renders its
 *   own header content that needs the inset).
 */
export function Screen({ style, children, edges, tabScreen, customHeader, ...rest }: ScreenProps) {
  const { colors } = useTheme();

  const resolvedEdges: Edge[] = edges ?? (tabScreen ? ['top'] : ['top', 'bottom']);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }, style]}
      edges={resolvedEdges}
    >
      <View style={styles.inner} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

/** Returns the bottom safe area inset value to use for scroll content padding */
export function useScrollBottomPadding(extraPadding: number = 0) {
  const insets = useSafeAreaInsets();
  return insets.bottom + extraPadding;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
