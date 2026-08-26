import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { typography } from '@/theme';

export function SplashScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.logoWrap}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.brand}>Mukurtham</Text>
      <Text style={styles.tagline}>Matrimony, made meaningful</Text>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
  },
  brand: {
    ...typography.display,
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 1,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  spinner: {
    marginTop: 48,
  },
});
