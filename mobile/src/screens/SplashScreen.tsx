import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/theme';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brand}>Mukurtham</Text>
      <Text style={styles.tagline}>Matrimony, made meaningful</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff0f5',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  brand: {
    ...typography.display,
    color: colors.primary,
    marginTop: 16,
  },
  tagline: {
    ...typography.body,
    color: colors.inkSoft,
    marginTop: 4,
  },
  spinner: {
    marginTop: 48,
  },
});
