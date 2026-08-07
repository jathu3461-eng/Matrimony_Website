import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { tokenStorage } from '@/services/tokenStorage';
import { colors, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Find your\nperfect match',
    subtitle: 'Browse genuine profiles curated for the Tamil community, worldwide.',
    icon: 'heart' as const,
    color: colors.primary,
    bg: '#fff0f5',
  },
  {
    title: 'Verified\nprofiles only',
    subtitle: 'Every profile is reviewed by our team so you connect with confidence.',
    icon: 'shield-checkmark' as const,
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    title: 'Meaningful\nconversations',
    subtitle: 'Send interests, chat safely once you match. Your privacy stays protected.',
    icon: 'chatbubbles' as const,
    color: '#2563eb',
    bg: '#eff6ff',
  },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const navigation = useNavigation<Nav>();
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const finish = async () => {
    await tokenStorage.setOnboardingDone();
    navigation.replace('Auth', { screen: 'Login' });
  };

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      <View style={styles.skipRow}>
        {!isLast && (
          <Button title="Skip" variant="ghost" size="sm" onPress={finish} />
        )}
      </View>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: `${slide.color}18` }]}>
          <Ionicons name={slide.icon} size={64} color={slide.color} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && { width: 28, backgroundColor: slide.color }]} />
          ))}
        </View>
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
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl + spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.inkSoft,
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
});
