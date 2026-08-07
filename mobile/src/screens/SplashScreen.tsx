import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { typography } from '@/theme';

export function SplashScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.primarySoft }]}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.brand, { color: colors.primary }]}>Mukurtham</Text>
      <Text style={[styles.tagline, { color: colors.inkSoft }]}>Matrimony, made meaningful</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  brand: {
    ...typography.display,
    marginTop: 16,
  },
  tagline: {
    ...typography.body,
    marginTop: 4,
  },
  spinner: {
    marginTop: 48,
  },
});
