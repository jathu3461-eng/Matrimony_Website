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
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';

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
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(secure ?? false);
  const [focused, setFocused] = useState(false);

  const hasValue = !!value;
  const showError = !!error;
  const showSuccess = hasValue && !error;
  const showHint = !error && !!hint && !hasValue;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.inkSoft }]}>{label}</Text>

      <View
        style={[
          styles.field,
          { borderColor: colors.border, backgroundColor: colors.surface },
          focused && { borderColor: colors.primary },
          showError && { borderColor: colors.error, backgroundColor: colors.errorSoft },
          showSuccess && { borderColor: colors.success },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.ink }]}
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
        {showSuccess && !secure && (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        )}
        {count && maxLength && (
          <Text style={[styles.counter, { color: colors.inkFaint }]}>
            {value?.length ?? 0}/{maxLength}
          </Text>
        )}
      </View>

      {showError && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
      {!showError && showHint && (
        <Text style={[styles.hintText, { color: colors.inkFaint }]}>{hint}</Text>
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
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: typography.body.fontSize,
  },
  eye: {
    marginLeft: spacing.sm,
  },
  counter: {
    ...typography.label,
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
    flex: 1,
  },
  hintText: {
    ...typography.label,
    marginTop: 4,
  },
});
