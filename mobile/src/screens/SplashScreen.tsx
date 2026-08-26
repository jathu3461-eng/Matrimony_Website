import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const PRIMARY = '#e0136a';
const PINK_GLOW = '#ff5f9e';

function FloatingHeart({
  delay,
  x,
  size,
  duration,
}: {
  delay: number;
  x: number;
  size: number;
  duration: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_W + 40, -60],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [x, x + 20, x - 10],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0.3, 1, 1, 0.3],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
    outputRange: [0, 0.3, 0.3, 0],
  });

  return (
    <Animated.Text
      style={[
        styles.floatingHeart,
        { fontSize: size },
        { transform: [{ translateY }, { translateX }, { scale }, { rotate }], opacity },
      ]}
    >
      ♥
    </Animated.Text>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1.2,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.6,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0.6, 1.2],
    outputRange: [0.4, 1],
  });

  return <Animated.View style={[styles.dot, { transform: [{ scale: anim }], opacity }]} />;
}

export function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(20)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslateY = useRef(new Animated.Value(15)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const coupleOpacity = useRef(new Animated.Value(0)).current;
  const coupleTranslateY = useRef(new Animated.Value(40)).current;
  const coupleFloat = useRef(new Animated.Value(0)).current;
  const coupleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 8,
        stiffness: 80,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(glowScale, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.85,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Expanding ring
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(ringOpacity, {
              toValue: 0.25,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    ).start();

    // Text cascade
    const stagger = (opacity: Animated.Value, translateY: Animated.Value, delayMs: number) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          delay: delayMs,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          delay: delayMs,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    };

    stagger(brandOpacity, brandTranslateY, 800);
    stagger(subOpacity, subTranslateY, 1100);
    stagger(taglineOpacity, taglineTranslateY, 1500);
    Animated.timing(dividerOpacity, {
      toValue: 1,
      duration: 500,
      delay: 1300,
      useNativeDriver: true,
    }).start();
    Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 400,
      delay: 1800,
      useNativeDriver: true,
    }).start();

    // Couple entrance
    Animated.parallel([
      Animated.spring(coupleTranslateY, {
        toValue: 0,
        damping: 10,
        stiffness: 60,
        useNativeDriver: true,
      }),
      Animated.timing(coupleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Couple floating bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(coupleFloat, {
          toValue: -8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coupleFloat, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Couple 3D tilt
    Animated.loop(
      Animated.sequence([
        Animated.timing(coupleRotate, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coupleRotate, {
          toValue: -1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const hearts = useMemo(
    () => [
      { delay: 0, x: SCREEN_W * 0.15, size: 18, duration: 4500 },
      { delay: 800, x: SCREEN_W * 0.75, size: 14, duration: 5200 },
      { delay: 1500, x: SCREEN_W * 0.4, size: 20, duration: 4800 },
      { delay: 2200, x: SCREEN_W * 0.85, size: 12, duration: 5500 },
      { delay: 3000, x: SCREEN_W * 0.25, size: 16, duration: 4200 },
      { delay: 3500, x: SCREEN_W * 0.6, size: 13, duration: 5000 },
    ],
    [],
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Floating hearts */}
      {hearts.map((h, i) => (
        <FloatingHeart key={i} {...h} />
      ))}

      {/* Decorative expanding ring */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />

      {/* Center content */}
      <View style={styles.center}>
        {/* Glow */}
        <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }] }]} />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ scale: logoScale }], opacity: logoOpacity },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Couple 3D image */}
        <Animated.View
          style={[
            styles.coupleWrap,
            {
              opacity: coupleOpacity,
              transform: [
                { translateY: Animated.add(coupleTranslateY, coupleFloat) },
                {
                  rotateY: coupleRotate.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-8deg', '8deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/couple.png')}
            style={styles.couple}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand */}
        <Animated.Text
          style={[
            styles.brand,
            { opacity: brandOpacity, transform: [{ translateY: brandTranslateY }] },
          ]}
        >
          Mukurtham
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: subOpacity, transform: [{ translateY: subTranslateY }] },
          ]}
        >
          MATRIMONY
        </Animated.Text>

        {/* Divider */}
        <Animated.View style={[styles.dividerRow, { opacity: dividerOpacity }]}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] },
          ]}
        >
          FIND YOUR FOREVER
        </Animated.Text>
      </View>

      {/* Loading dots */}
      <Animated.View style={[styles.loadingArea, { opacity: dotsOpacity }]}>
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

  floatingHeart: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.25)',
    zIndex: 1,
  },

  ring: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    top: '50%',
    marginTop: -180,
    alignSelf: 'center',
  },

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

  coupleWrap: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
  },
  couple: {
    width: 140,
    height: 140,
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
