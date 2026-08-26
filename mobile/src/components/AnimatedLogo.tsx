import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const PRIMARY = '#e0136a';
const GOLD = '#d4a853';

type Shape = 'circle' | 'diamond' | 'squircle' | 'hexagon' | 'arch';

interface AnimatedLogoProps {
  shape?: Shape;
  size?: number;
  animate?: boolean;
}

function DiamondMask({ size }: { size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        transform: [{ rotate: '45deg' }],
        borderRadius: size * 0.12,
        overflow: 'hidden',
      }}
    />
  );
}

export function AnimatedLogo({ shape = 'circle', size = 100, animate = true }: AnimatedLogoProps) {
  const floatY = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const rotateX = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const scaleIn = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!animate) {
      scaleIn.setValue(1);
      return;
    }

    Animated.spring(scaleIn, {
      toValue: 1,
      damping: 12,
      stiffness: 80,
      useNativeDriver: true,
    }).start();

    // Floating bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -5,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 3D tilt
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rotateY, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateX, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(rotateY, {
            toValue: -1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateX, {
            toValue: -1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const getContainerStyle = () => {
    const base: any[] = [
      {
        width: size,
        height: size,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
    ];

    switch (shape) {
      case 'diamond':
        return [
          ...base,
          {
            transform: [
              { rotate: '45deg' },
              { translateY: floatY },
              {
                rotateY: rotateY.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-8deg', '8deg'],
                }),
              },
              {
                rotateX: rotateX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['4deg', '-4deg'],
                }),
              },
              { perspective: 600 },
            ],
          },
        ];
      case 'squircle':
        return [
          ...base,
          {
            borderRadius: size * 0.22,
            borderWidth: 2,
            borderColor: PRIMARY,
            shadowColor: PRIMARY,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            transform: [
              { translateY: floatY },
              {
                rotateY: rotateY.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-6deg', '6deg'],
                }),
              },
              {
                rotateX: rotateX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['3deg', '-3deg'],
                }),
              },
              { perspective: 700 },
            ],
          },
        ];
      case 'hexagon':
        return [
          ...base,
          {
            borderRadius: size * 0.18,
            borderWidth: 2,
            borderColor: GOLD,
            shadowColor: GOLD,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 9,
            transform: [
              { translateY: floatY },
              {
                rotateY: rotateY.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-10deg', '10deg'],
                }),
              },
              {
                rotateX: rotateX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['5deg', '-5deg'],
                }),
              },
              { perspective: 500 },
            ],
          },
        ];
      case 'arch':
        return [
          ...base,
          {
            borderRadius: size / 2,
            borderTopLeftRadius: size / 2,
            borderTopRightRadius: size / 2,
            borderBottomLeftRadius: size * 0.05,
            borderBottomRightRadius: size * 0.05,
            borderWidth: 2,
            borderColor: PRIMARY,
            shadowColor: PRIMARY,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
            transform: [
              { translateY: floatY },
              {
                rotateY: rotateY.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-7deg', '7deg'],
                }),
              },
              { perspective: 650 },
            ],
          },
        ];
      case 'circle':
      default:
        return [
          ...base,
          {
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: PRIMARY,
            shadowColor: PRIMARY,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
            transform: [
              { translateY: floatY },
              {
                rotateY: rotateY.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-6deg', '6deg'],
                }),
              },
              {
                rotateX: rotateX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['3deg', '-3deg'],
                }),
              },
              { perspective: 700 },
            ],
          },
        ];
    }
  };

  const imgSize = shape === 'diamond' ? size * 0.6 : size * 0.7;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          backgroundColor: shape === 'hexagon' ? 'rgba(212,168,83,0.2)' : 'rgba(224,19,106,0.15)',
          opacity: glowOpacity,
          transform: [{ scale: scaleIn }],
        }}
      />
      {/* Container */}
      <Animated.View style={getContainerStyle()}>
        <Animated.View style={{ transform: [{ scale: scaleIn }] }}>
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: imgSize, height: imgSize }}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
