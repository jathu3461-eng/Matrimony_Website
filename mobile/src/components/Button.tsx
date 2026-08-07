import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { radius, typography } from '@/theme';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  titleStyle,
  leftIcon,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 20 },
    lg: { paddingVertical: 16, paddingHorizontal: 24 },
  }[size];

  const variantStyles = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.primarySoft },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.error },
  }[variant];

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? colors.white
      : variant === 'secondary'
        ? colors.primaryDark
        : colors.primary;

  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles,
        variantStyles,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon && (
            <Ionicons name={leftIcon} size={iconSize} color={textColor} style={styles.icon} />
          )}
          <Text style={[styles.text, { color: textColor }, titleStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  icon: {
    marginRight: 6,
  },
});
