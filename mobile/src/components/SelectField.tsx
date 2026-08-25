import { useState } from 'react';
import {
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  error,
  required,
  containerStyle,
}: SelectFieldProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const selected = options.find((o) => o.value === value);
  const showError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.inkSoft }]}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>

      <Pressable
        onPress={() => { setVisible(true); setFocused(true); }}
        style={[
          styles.field,
          { borderColor: colors.border, backgroundColor: colors.surface },
          focused && { borderColor: colors.primary },
          showError && { borderColor: colors.error, backgroundColor: colors.errorSoft },
          selected && { borderColor: colors.success },
        ]}
      >
        <Text
          style={[
            styles.value,
            { color: selected ? colors.ink : colors.inkFaint },
          ]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.inkFaint}
        />
      </Pressable>

      {showError && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setVisible(false);
                      setFocused(false);
                    }}
                    style={[
                      styles.option,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? colors.primary : colors.ink },
                        isSelected && { fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  value: {
    flex: 1,
    fontSize: typography.body.fontSize,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '60%',
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.title,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: typography.body.fontSize,
    flex: 1,
  },
});
