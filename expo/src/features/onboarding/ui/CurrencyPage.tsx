import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, borderWidth, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { type ActiveCurrency } from '../../../core/domain/activeCurrency';
import { CURRENCY_OPTIONS } from '../domain/slides';

export function CurrencyPage({ selected, onSelect }: { selected: ActiveCurrency; onSelect: (code: ActiveCurrency) => void }) {
  useThemeRevision();
  return (
    <>
      <View accessibilityRole="radiogroup" accessibilityLabel="Para birimi" style={styles.options}>
        {CURRENCY_OPTIONS.map(option => {
          const active = selected === option.code;
          return <Pressable key={option.code} accessibilityRole="radio" accessibilityLabel={`${option.name}, ${option.code}`} accessibilityState={{ checked: active, selected: active }} onPress={() => onSelect(option.code)} style={[styles.option, active && styles.selected]}>
            <Text style={[textStyle('title', { color: active ? colors.primary : colors.onSurfaceVariant }), styles.symbol]}>{option.symbol}</Text>
            <View style={styles.labels}><Text style={textStyle('bodyStrong')}>{option.name}</Text><Text style={textStyle('caption')}>{option.code}</Text></View>
            <MaterialIcons name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={sizes.checkIcon} color={active ? colors.primary : colors.onSurfaceVariant} />
          </Pressable>;
        })}
      </View>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={textStyle('headline')}>Para birimini seç.</Text>
        <Text style={[textStyle('body', { color: colors.onSurfaceVariant }), styles.body]}>Bunu daha sonra Ayarlar’dan değiştirebilirsin.</Text>
      </View>
    </>
  );
}
const styles = themedStyles(() => StyleSheet.create({
  options: { minHeight: spacing.huge * 5, justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xxxl },
  option: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md, borderRadius: radius.md, borderWidth: borderWidth.regular, borderColor: colors.border, backgroundColor: colors.surfaceHigh },
  selected: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, 0.08) },
  symbol: { width: spacing.xxl, textAlign: 'center' },
  labels: { flex: 1 },
  body: { marginTop: spacing.md, lineHeight: sizes.bodyLine },
  copy: { minHeight: spacing.huge * 3 },
}));
