import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { typography } from '@/theme';

export function SplashScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
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
  logo: {
    width: 240,
    height: 240,
  },
  spinner: {
    marginTop: 40,
  },
});
