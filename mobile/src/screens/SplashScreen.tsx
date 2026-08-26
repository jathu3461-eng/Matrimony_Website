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
import { AnimatedLogo } from '@/components/AnimatedLogo';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PRIMARY = '#e0136a';
const GOLD = '#d4a853';
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
    outputRange: [SCREEN_H + 40, -60],
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

function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 0],
  });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: x,
          top: y,
          transform: [{ scale }],
          opacity: anim,
        },
      ]}
    />
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

  const archScale = useRef(new Animated.Value(0)).current;
  const archOpacity = useRef(new Animated.Value(0)).current;
  const archBorder = useRef(new Animated.Value(0)).current;
  const coupleFloat = useRef(new Animated.Value(0)).current;
  const coupleRotateY = useRef(new Animated.Value(0)).current;
  const coupleRotateX = useRef(new Animated.Value(0)).current;
  const archGlow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Arch entrance — dramatic scale + fade
    Animated.parallel([
      Animated.spring(archScale, {
        toValue: 1,
        damping: 12,
        stiffness: 60,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(archOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Arch golden border shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(archBorder, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(archBorder, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();

    // Arch glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(archGlow, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(archGlow, {
          toValue: 0.6,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Couple floating bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(coupleFloat, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coupleFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Couple 3D perspective tilt — X and Y axes
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(coupleRotateY, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(coupleRotateX, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(coupleRotateY, {
            toValue: -1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(coupleRotateX, {
            toValue: -1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

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

    stagger(brandOpacity, brandTranslateY, 1200);
    stagger(subOpacity, subTranslateY, 1500);
    stagger(taglineOpacity, taglineTranslateY, 1900);
    Animated.timing(dividerOpacity, {
      toValue: 1,
      duration: 500,
      delay: 1700,
      useNativeDriver: true,
    }).start();
    Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 400,
      delay: 2200,
      useNativeDriver: true,
    }).start();
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

  const sparkles = useMemo(
    () => [
      { delay: 0, x: SCREEN_W * 0.2, y: SCREEN_H * 0.18 },
      { delay: 400, x: SCREEN_W * 0.75, y: SCREEN_H * 0.22 },
      { delay: 800, x: SCREEN_W * 0.12, y: SCREEN_H * 0.35 },
      { delay: 1200, x: SCREEN_W * 0.82, y: SCREEN_H * 0.32 },
      { delay: 600, x: SCREEN_W * 0.5, y: SCREEN_H * 0.15 },
    ],
    [],
  );

  const borderWidth = archBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 3.5],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {hearts.map((h, i) => (
        <FloatingHeart key={i} {...h} />
      ))}

      {sparkles.map((s, i) => (
        <Sparkle key={`sparkle-${i}`} {...s} />
      ))}

      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />

      <View style={styles.center}>
        <Animated.View style={[styles.glow, { transform: [{ scale: glowScale }] }]} />

        {/* Logo — circle shape with 3D animation */}
        <View style={styles.logoWrap}>
          <AnimatedLogo shape="circle" size={120} />
        </View>

        {/* Couple arch frame */}
        <Animated.View
          style={[
            styles.archOuter,
            {
              opacity: archOpacity,
              transform: [{ scale: archScale }],
            },
          ]}
        >
          {/* Arch glow */}
          <Animated.View
            style={[styles.archGlowRing, { opacity: archGlow }]}
          />

          {/* Arch border */}
          <Animated.View
            style={[
              styles.archFrame,
              { borderWidth },
            ]}
          >
            {/* Couple image with 3D transforms */}
            <Animated.View
              style={[
                styles.coupleContainer,
                {
                  transform: [
                    { translateY: coupleFloat },
                    {
                      rotateY: coupleRotateY.interpolate({
                        inputRange: [-1, 1],
                        outputRange: ['-10deg', '10deg'],
                      }),
                    },
                    {
                      rotateX: coupleRotateX.interpolate({
                        inputRange: [-1, 1],
                        outputRange: ['3deg', '-3deg'],
                      }),
                    },
                    { perspective: 800 },
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
          </Animated.View>
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

        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: subOpacity, transform: [{ translateY: subTranslateY }] },
          ]}
        >
          MATRIMONY
        </Animated.Text>

        <Animated.View style={[styles.dividerRow, { opacity: dividerOpacity }]}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.tagline,
            { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] },
          ]}
        >
          FIND YOUR FOREVER
        </Animated.Text>
      </View>

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

const ARCH_W = SCREEN_W * 0.52;
const ARCH_H = ARCH_W * 1.35;

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
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 2,
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
    marginBottom: 20,
  },

  archOuter: {
    width: ARCH_W + 20,
    height: ARCH_H + 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  archGlowRing: {
    position: 'absolute',
    width: ARCH_W + 16,
    height: ARCH_H + 16,
    borderRadius: ARCH_W / 2,
    borderTopLeftRadius: ARCH_W / 2,
    borderTopRightRadius: ARCH_W / 2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,200,120,0.4)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  archFrame: {
    width: ARCH_W,
    height: ARCH_H,
    borderRadius: ARCH_W / 2,
    borderTopLeftRadius: ARCH_W / 2,
    borderTopRightRadius: ARCH_W / 2,
    borderColor: GOLD,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  coupleContainer: {
    width: ARCH_W - 16,
    height: ARCH_H - 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couple: {
    width: ARCH_W - 24,
    height: ARCH_H - 24,
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
