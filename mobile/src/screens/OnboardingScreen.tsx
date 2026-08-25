import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { tokenStorage } from '@/services/tokenStorage';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OnboardingScreen() {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const navigation = useNavigation<Nav>();
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const finish = async () => {
    await tokenStorage.setOnboardingDone();
    navigation.replace('Auth', { screen: 'Login' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.skipRow}>
        {!isLast && (
          <Button title="Skip" variant="ghost" size="sm" onPress={finish} />
        )}
      </View>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: `${slide.color}18` }]}>
          <Ionicons name={slide.icon} size={64} color={slide.color} />
        </View>
        <Text style={[styles.title, { color: colors.ink }]}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: colors.inkSoft }]}>{slide.subtitle}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.borderStrong },
                i === index && { width: 28, backgroundColor: slide.color },
              ]}
            />
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

const SLIDES = [
  {
    title: 'Find your\nperfect match',
    subtitle: 'Browse genuine profiles curated for the Tamil community, worldwide.',
    icon: 'heart' as const,
    color: '#e0136a',
  },
  {
    title: 'Verified\nprofiles only',
    subtitle: 'Every profile is reviewed by our team so you connect with confidence.',
    icon: 'shield-checkmark' as const,
    color: '#16a34a',
  },
  {
    title: 'Meaningful\nconversations',
    subtitle: 'Send interests, chat safely once you match. Your privacy stays protected.',
    icon: 'chatbubbles' as const,
    color: '#2563eb',
  },
];

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
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
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
  },
});
