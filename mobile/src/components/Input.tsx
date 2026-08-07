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

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  secure?: boolean;
}

export function Input({ label, error, containerStyle, secure, style, ...rest }: InputProps) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(secure ?? false);
  const showError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.inkSoft }]}>{label}</Text>}
      <View
        style={[
          styles.field,
          { borderColor: colors.border, backgroundColor: colors.surface },
          showError && { borderColor: colors.error },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.ink }, style]}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={hidden}
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
      </View>
      {showError && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
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
    marginBottom: spacing.xs + 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
  errorText: {
    ...typography.caption,
    marginTop: 4,
  },
});
