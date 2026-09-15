import { StyleSheet, Text, TextInput, View } from 'react-native';
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

/** Convert cm to feet + inches (handles 12-inch carry) */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) return { feet: feet + 1, inches: 0 };
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
      <Text style={[styles.hint, { color: colors.inkFaint, marginBottom: spacing.md }]}>
        {t('heightHint') || 'Enter height in any unit — the other updates automatically.'}
      </Text>

      {/* Three-column: cm | feet | inches */}
      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <Text style={[styles.unitLabel, { color: colors.inkFaint }]}>cm</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            value={cmValue > 0 ? String(cmValue) : ''}
            onChangeText={handleCmChange}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="170"
            placeholderTextColor={colors.inkFaint}
          />
        </View>
        <Text style={[styles.dash, { color: colors.inkFaint }]}>—</Text>
        <View style={styles.inputWrap}>
          <Text style={[styles.unitLabel, { color: colors.inkFaint }]}>{t('heightFeet') || 'Feet'}</Text>
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
          <Text style={[styles.unitLabel, { color: colors.inkFaint }]}>{t('heightInches') || 'Inches'}</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.ink, borderColor: errorInches ? colors.error : colors.border, backgroundColor: colors.surface },
            ]}
            value={inches}
            onChangeText={onInchesChange}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="7"
            placeholderTextColor={colors.inkFaint}
          />
          {errorInches && <Text style={[styles.error, { color: colors.error }]}>{errorInches}</Text>}
        </View>
      </View>

      {/* Combined display */}
      {cmValue > 0 && (
        <Text style={[styles.combinedDisplay, { color: colors.primary }]}>
          {cmValue} cm — {feetNum}'{inchesNum}"
        </Text>
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    label: {
      ...typography.caption,
      fontWeight: '700',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    hint: {
      ...typography.label,
      marginBottom: 4,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    inputWrap: {
      flex: 1,
    },
    dash: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 18,
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
    combinedDisplay: {
      ...typography.body,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: spacing.md,
    },
    error: {
      ...typography.label,
      marginTop: 4,
      fontWeight: '600',
    },
  });
}
