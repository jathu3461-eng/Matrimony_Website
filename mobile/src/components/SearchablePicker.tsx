import { useState, useRef } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';

export interface PickerOption {
  value: string | number;
  label: string;
}

interface SearchablePickerProps {
  label?: string;
  options: PickerOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
}

export function SearchablePicker({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  required,
  error,
  hint,
}: SearchablePickerProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase().trim()))
    : options;

  const styles = makeStyles(colors);

  const showSearch = options.length > 10;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.inkSoft }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      <Pressable
        style={[
          styles.trigger,
          { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
        ]}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selected ? colors.ink : colors.inkFaint },
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.inkFaint} />
      </Pressable>

      {hint && !error && (
        <Text style={[styles.hint, { color: colors.inkFaint }]}>{hint}</Text>
      )}
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>{label || 'Select'}</Text>
            <Pressable
              onPress={() => {
                setVisible(false);
                setQuery('');
              }}
            >
              <Ionicons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>

          {showSearch && (
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.inkFaint} />
              <TextInput
                ref={inputRef}
                style={[styles.searchInput, { color: colors.ink }]}
                placeholder="Search..."
                placeholderTextColor={colors.inkFaint}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.inkFaint} />
                </Pressable>
              )}
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.option,
                  { borderBottomColor: colors.border },
                  String(item.value) === String(value) && { backgroundColor: colors.primarySoft },
                ]}
                onPress={() => {
                  onChange(String(item.value));
                  setVisible(false);
                  setQuery('');
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: String(item.value) === String(value) ? colors.primary : colors.ink,
                      fontWeight: String(item.value) === String(value) ? '700' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {String(item.value) === String(value) && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.inkFaint }]}>No options found</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: {
      ...typography.caption,
      fontWeight: '700',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      gap: spacing.sm,
    },
    triggerText: { ...typography.body, flex: 1 },
    hint: { ...typography.label, marginTop: 4 },
    error: { ...typography.label, marginTop: 4, fontWeight: '600' },
    modal: { flex: 1 },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
    },
    modalTitle: { ...typography.title, fontWeight: '700' },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: typography.body.fontSize,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    optionText: { ...typography.body, flex: 1 },
    empty: { textAlign: 'center', paddingVertical: spacing.xxl, ...typography.body },
  });
}
