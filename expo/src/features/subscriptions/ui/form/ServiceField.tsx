import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, radius, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { TextField } from '../../../../shared/widgets/TextField';
import { type FormErrors, type SubscriptionFormValues } from '../../domain/subscriptionForm';
import { type ServicePreset } from '../../domain/servicePresets';
import { ServiceIdentity } from '../ServiceIdentity';
import type { FormChange } from './formTypes';

/**
 * Hızlı seç (yalnızca ekleme): popüler servis çipleri; altında servis adı alanı (marka ikonu önekiyle).
 * Ad bir servisle eşleşirse kategori de gelir.
 */
export function ServiceField({
  values,
  errors,
  presets,
  showPresets,
  disabled,
  nameNotice,
  onChange,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  presets: readonly ServicePreset[];
  showPresets: boolean;
  disabled: boolean;
  /** Ada ilişkin engellemeyen bilgi uyarısı (örn. aynı isimde kayıt var). */
  nameNotice?: string;
  onChange: FormChange;
}) {
  useThemeRevision();
  const currentName = values.name.trim().toLowerCase();

  function pickPreset(preset: ServicePreset) {
    onChange('name', preset.name);
    onChange('category', preset.category);
  }

  function nameChanged(next: string) {
    onChange('name', next);
    const match = presets.find((preset) => preset.name.trim().toLowerCase() === next.trim().toLowerCase());
    if (match) onChange('category', match.category);
  }

  return (
    <View style={styles.block}>
      {showPresets && presets.length > 0 ? (
        <View style={styles.presetsBlock}>
          <View style={styles.presetsHeading}>
            <Text style={textStyle('overline')}>Hızlı seç</Text>
            <View style={styles.scrollHint}>
              <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Yana kaydır</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.onSurfaceVariant} />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.presetRow}>
            {presets.map((preset) => {
              const selected = currentName === preset.name.trim().toLowerCase();
              return (
                <Pressable
                  key={preset.name}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => pickPreset(preset)}
                  style={[styles.preset, selected && styles.presetSelected]}
                >
                  <ServiceIdentity name={preset.name} category={preset.category} size={26} />
                  <Text style={textStyle(selected ? 'label' : 'bodySmall', { marginLeft: spacing.xs, color: selected ? colors.onPrimary : colors.onSurface })}>{preset.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <TextField
        label="Servis"
        placeholder="Örn. Netflix"
        value={values.name}
        onChangeText={nameChanged}
        error={errors.name}
        maxLength={160}
        editable={!disabled}
        prefix={<ServiceIdentity name={values.name} category={values.category} size={28} />}
      />
      {nameNotice && !errors.name ? (
        <Text accessibilityRole="text" style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{nameNotice}</Text>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  block: {
    gap: spacing.sm,
  },
  presetsBlock: {
    gap: spacing.xs,
  },
  presetsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  presetRow: {
    gap: gaps.hint,
    paddingVertical: spacing.xxs,
  },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
  },
  presetSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
}));
