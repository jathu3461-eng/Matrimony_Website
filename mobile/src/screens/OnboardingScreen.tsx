import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { tokenStorage } from '@/services/tokenStorage';
import { colors, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

const SLIDES = [
  {
    title: 'Find your perfect match',
    subtitle: 'Browse genuine profiles curated for the Tamil community, worldwide.',
    icon: 'heart' as const,
    color: '#e0136a',
  },
  {
    title: 'Verified profiles only',
    subtitle: 'Every profile is reviewed by our team so you can connect with confidence.',
    icon: 'shield-checkmark' as const,
    color: '#16a34a',
  },
  {
    title: 'Meaningful conversations',
    subtitle: 'Send interests and chat safely once you match. Your privacy stays protected.',
    icon: 'chatbubbles' as const,
    color: '#2563eb',
  },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();
  const navigation = useNavigation<Nav>();
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await tokenStorage.setOnboardingDone();
    navigation.replace('Auth', { screen: 'Login' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        {!isLast && (
          <Button title="Skip" variant="ghost" size="sm" onPress={finish} />
        )}
      </View>

      <View style={[styles.slide, { width }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${SLIDES[index].color}15` }]}>
          <Ionicons name={SLIDES[index].icon} size={56} color={SLIDES[index].color} />
        </View>
        <Text style={styles.title}>{SLIDES[index].title}</Text>
        <Text style={styles.subtitle}>{SLIDES[index].subtitle}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title={isLast ? 'Get Started' : 'Next'}
          size="lg"
          onPress={() => (isLast ? finish() : setIndex((i) => i + 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff0f5',
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.display,
    textAlign: 'center',
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.inkSoft,
    marginTop: spacing.md,
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
