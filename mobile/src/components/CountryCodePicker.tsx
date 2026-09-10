import { useState, useRef } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';
import { searchCountryCodes, DEFAULT_COUNTRY, type CountryCode } from '@/data/countryCodes';

interface CountryCodePickerProps {
  selectedCode: string;
  onSelect: (country: CountryCode) => void;
}

export function CountryCodePicker({ selectedCode, onSelect }: CountryCodePickerProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const selected = searchCountryCodes('').find((c) => c.code === selectedCode) || DEFAULT_COUNTRY;
  const filtered = searchCountryCodes(query);

  const styles = makeStyles(colors);

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={[styles.dialCode, { color: colors.ink }]}>{selected.dialCode}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.inkFaint} />
      </Pressable>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.ink }]}>Select Country</Text>
            <Pressable onPress={() => { setVisible(false); setQuery(''); }}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>

          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.inkFaint} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.ink }]}
              placeholder="Search country or code..."
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

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.row,
                  { borderBottomColor: colors.border },
                  item.code === selected.code && { backgroundColor: colors.primarySoft },
                ]}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                  setQuery('');
                }}
              >
                <Text style={styles.rowFlag}>{item.flag}</Text>
                <Text style={[styles.rowName, { color: colors.ink }]}>{item.name}</Text>
                <Text style={[styles.rowDial, { color: colors.inkSoft }]}>{item.dialCode}</Text>
                {item.code === selected.code && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.inkFaint }]}>No countries found</Text>
            }
          />
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 85,
    },
    flag: { fontSize: 18 },
    dialCode: { fontSize: 15, fontWeight: '600' },
    modal: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
    },
    headerTitle: { ...typography.title, fontWeight: '700' },
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowFlag: { fontSize: 22 },
    rowName: { flex: 1, ...typography.body, fontWeight: '500' },
    rowDial: { ...typography.body, fontWeight: '600' },
    empty: { textAlign: 'center', paddingVertical: spacing.xxl, ...typography.body },
  });
}
