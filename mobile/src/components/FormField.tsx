import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  containerStyle?: ViewStyle;
  secure?: boolean;
  maxLength?: number;
  count?: boolean;
}

export function FormField({
  label,
  error,
  hint,
  containerStyle,
  secure,
  style,
  value,
  maxLength,
  count,
  ...rest
}: FormFieldProps) {
  const [hidden, setHidden] = useState(secure ?? false);
  const [focused, setFocused] = useState(false);
  const showError = !!error && !focused;
  const showHint = !error && !!hint && !focused && !value;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          showError && styles.fieldError,
          showError && { borderColor: colors.error },
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={hidden}
          value={value}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} style={styles.eye}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.inkFaint}
            />
          </Pressable>
        )}
        {count && maxLength && (
          <Text style={styles.counter}>
            {value?.length ?? 0}/{maxLength}
          </Text>
        )}
      </View>
      {showError && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {showHint && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
      {!showError && !showHint && focused && hint && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  fieldFocused: {
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.error,
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: typography.body.fontSize,
    color: colors.ink,
  },
  eye: {
    marginLeft: spacing.sm,
  },
  counter: {
    ...typography.label,
    color: colors.inkFaint,
    marginLeft: spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    ...typography.label,
    color: colors.error,
    flex: 1,
  },
  hintText: {
    ...typography.label,
    color: colors.inkFaint,
    marginTop: 4,
  },
});
