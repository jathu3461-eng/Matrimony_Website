import { useEffect, useMemo } from 'react';
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PRIMARY = '#e0136a';
const PRIMARY_DARK = '#b80f55';
const PINK_GLOW = '#ff5f9e';

function FloatingHeart({ delay, x, size, duration }: { delay: number; x: number; size: number; duration: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration }, () => { progress.value = 0; }),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [SCREEN_H + 40, -60]) },
      { translateX: interpolate(progress.value, [0, 0.5, 1], [x, x + 20, x - 10]) },
      { scale: interpolate(progress.value, [0, 0.1, 0.9, 1], [0.3, 1, 1, 0.3]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-15, 15])}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.1, 0.85, 1], [0, 0.35, 0.35, 0]),
  }));

  return (
    <Animated.Text style={[styles.floatingHeart, { fontSize: size }, style]}>
      ♥
    </Animated.Text>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(0.6, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.6, 1.2], [0.4, 1]),
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function SplashScreen() {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const ringScale = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 80, mass: 0.8 }));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    glowScale.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200 }),
        withTiming(0.85, { duration: 1200 }),
      ),
      -1,
      false,
    ));
    ringScale.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    ));
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [0, 0.5, 1], [0, 0.3, 0]),
  }));

  const hearts = useMemo(() => [
    { delay: 0, x: SCREEN_W * 0.15, size: 18, duration: 4500 },
    { delay: 800, x: SCREEN_W * 0.75, size: 14, duration: 5200 },
    { delay: 1500, x: SCREEN_W * 0.4, size: 20, duration: 4800 },
    { delay: 2200, x: SCREEN_W * 0.85, size: 12, duration: 5500 },
    { delay: 3000, x: SCREEN_W * 0.25, size: 16, duration: 4200 },
    { delay: 3500, x: SCREEN_W * 0.6, size: 13, duration: 5000 },
  ], []);

  return (
    <View style={styles.container}>
      {/* Background gradient simulation */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Floating hearts */}
      {hearts.map((h, i) => (
        <FloatingHeart key={i} {...h} />
      ))}

      {/* Decorative rings */}
      <Animated.View style={[styles.decoRing, styles.decoRing1, ringStyle]} />
      <Animated.View style={[styles.decoRing, styles.decoRing2, ringStyle]} />
      <Animated.View style={[styles.decoRing, styles.decoRing3, ringStyle]} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Glow behind logo */}
        <Animated.View style={[styles.glow, glowStyle]} />

        {/* Logo */}
        <Animated.View style={[styles.logoWrap, logoAnimStyle]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand name */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <Text style={styles.brand}>Mukurtham</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
          <Text style={styles.subtitle}>MATRIMONY</Text>
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeIn.delay(1300).duration(500)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeInUp.delay(1500).duration(600)}>
          <Text style={styles.tagline}>FIND YOUR FOREVER</Text>
        </Animated.View>
      </View>

      {/* Loading dots */}
      <Animated.View entering={FadeIn.delay(1800).duration(400)} style={styles.loadingArea}>
        <View style={styles.dotsRow}>
          <PulsingDot delay={0} />
          <PulsingDot delay={200} />
          <PulsingDot delay={400} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PRIMARY,
    height: '55%',
  },
  bgBottom: {
    ...StyleSheet.absoluteFillObject,
    top: '55%',
    backgroundColor: '#fdf2f8',
  },

  // Floating hearts
  floatingHeart: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.25)',
    zIndex: 1,
  },

  // Decorative rings
  decoRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
  },
  decoRing1: {
    width: 280,
    height: 280,
    top: '22%',
    left: (SCREEN_W - 280) / 2,
  },
  decoRing2: {
    width: 360,
    height: 360,
    top: '18%',
    left: (SCREEN_W - 360) / 2,
  },
  decoRing3: {
    width: 440,
    height: 440,
    top: '14%',
    left: (SCREEN_W - 440) / 2,
  },

  // Center content
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,95,158,0.25)',
    top: '50%',
    marginTop: -150,
  },
  logoWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 160,
    height: 160,
  },

  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 6,
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PINK_GLOW,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 3,
  },

  // Loading dots
  loadingArea: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
});
