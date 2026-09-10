import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';

interface HeightPickerProps {
  feet: string;
  inches: string;
  onFeetChange: (v: string) => void;
  onInchesChange: (v: string) => void;
  errorFeet?: string | null;
  errorInches?: string | null;
}

export type HeightUnit = 'ft_in' | 'cm';

/** Convert cm to feet + inches */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

/** Convert feet + inches to cm */
export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}

export function HeightPicker({
  feet,
  inches,
  onFeetChange,
  onInchesChange,
  errorFeet,
  errorInches,
}: HeightPickerProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [unit, setUnit] = useState<HeightUnit>('ft_in');
  const { isTamil } = useI18n();

  const feetNum = parseInt(feet, 10) || 0;
  const inchesNum = parseInt(inches, 10) || 0;
  const cmValue = feetInchesToCm(feetNum, inchesNum);

  const styles = makeStyles(colors);

  const handleCmChange = (cmStr: string) => {
    const cm = parseInt(cmStr, 10);
    if (isNaN(cm) || cm < 100 || cm > 250) {
      onFeetChange(cmStr ? '0' : '');
      onInchesChange('');
      return;
    }
    const { feet: f, inches: i } = cmToFeetInches(cm);
    onFeetChange(String(f));
    onInchesChange(String(i));
  };

  return (
    <View>
      <Text style={[styles.label, { color: colors.inkSoft }]}>
        {t('stepHeight')}
      </Text>

      {/* Unit toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[
            styles.toggleBtn,
            unit === 'ft_in'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          ]}
          onPress={() => setUnit('ft_in')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: unit === 'ft_in' ? '#fff' : colors.ink },
            ]}
          >
            {t('heightUnitFtIn')}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleBtn,
            unit === 'cm'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          ]}
          onPress={() => setUnit('cm')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: unit === 'cm' ? '#fff' : colors.ink },
            ]}
          >
            {t('heightUnitCm')}
          </Text>
        </Pressable>
      </View>

      {unit === 'ft_in' ? (
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Text style={[styles.unitLabel, { color: colors.inkFaint }]}>{t('heightFeet')}</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.ink, borderColor: errorFeet ? colors.error : colors.border, backgroundColor: colors.surface },
              ]}
              value={feet}
              onChangeText={onFeetChange}
              keyboardType="number-pad"
              maxLength={1}
              placeholder="5"
              placeholderTextColor={colors.inkFaint}
            />
            {errorFeet && <Text style={[styles.error, { color: colors.error }]}>{errorFeet}</Text>}
          </View>
          <View style={styles.inputWrap}>
            <Text style={[styles.unitLabel, { color: colors.inkFaint }]}>{t('heightInches')}</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.ink, borderColor: errorInches ? colors.error : colors.border, backgroundColor: colors.surface },
              ]}
              value={inches}
              onChangeText={onInchesChange}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="6"
              placeholderTextColor={colors.inkFaint}
            />
            {errorInches && <Text style={[styles.error, { color: colors.error }]}>{errorInches}</Text>}
          </View>
        </View>
      ) : (
        <View style={styles.inputWrap}>
          <Text style={[styles.unitLabel, { color: colors.inkFaint }]}>{t('heightCm')}</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            value={cmValue > 0 ? String(cmValue) : ''}
            onChangeText={handleCmChange}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="165"
            placeholderTextColor={colors.inkFaint}
          />
          <Text style={[styles.hint, { color: colors.inkFaint }]}>
            {feetNum > 0 ? `${feetNum}'${inchesNum}"` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    label: {
      ...typography.caption,
      fontWeight: '700',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    toggleRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    toggleBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 8,
    },
    toggleText: {
      ...typography.label,
      fontWeight: '700',
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    inputWrap: {
      flex: 1,
    },
    unitLabel: {
      ...typography.label,
      fontWeight: '600',
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: typography.body.fontSize,
      textAlign: 'center',
    },
    hint: {
      ...typography.label,
      marginTop: 4,
      textAlign: 'center',
    },
    error: {
      ...typography.label,
      marginTop: 4,
      fontWeight: '600',
    },
  });
}
