import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { type ActiveCurrency } from '../../../core/domain/activeCurrency';
import { CURRENCY_OPTIONS } from '../domain/slides';
import { borderWidth, colors, extraRadius, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { onboardingColors } from '../../../shared/design/palette';
import { textStyle } from '../../../shared/design/typography';
import { EntranceFade } from '../../../shared/widgets/EntranceFade';
import { GlowOrb } from '../../../shared/widgets/GlowOrb';
import { Bob } from './OnboardingMotion';

/**
 * Flutter `CurrencyPage`: süzülen para birimi çipleri, başlık ve dört seçenek. Seçim `onSelect` ile
 * üst ekrana iletilir; kalıcı kayıt üst ekranda yapılır.
 */
export function CurrencyPage({ selected, onSelect }: { selected: ActiveCurrency; onSelect: (code: ActiveCurrency) => void }) {
  return (
    <View style={styles.page}>
      <EntranceFade>
        <FloatingChips />
      </EntranceFade>
      <View style={styles.gapTitle} />
      <EntranceFade delay={80}>
        <Text style={textStyle('headlineSmallStrong', { textAlign: 'center' })}>Para birimi seç</Text>
      </EntranceFade>
      <View style={styles.gapSmall} />
      <EntranceFade delay={120}>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'center' })}>
          Daha sonra ayarlardan değiştirebilirsin.
        </Text>
      </EntranceFade>
      <View style={styles.gapOptions} />
      <EntranceFade delay={160}>
        <View>
          {CURRENCY_OPTIONS.map((option) => (
            <CurrencyOption
              key={option.code}
              symbol={option.symbol}
              name={option.name}
              code={option.code}
              selected={selected === option.code}
              onPress={() => onSelect(option.code)}
            />
          ))}
        </View>
      </EntranceFade>
    </View>
  );
}

function FloatingChips() {
  return (
    <View style={styles.chipsBox}>
      <View style={styles.chipsCenter}>
        <GlowOrb icon="currency-exchange" color={colors.primary} size={sizes.glowCore} />
      </View>
      <View style={[styles.floating, { top: 2, left: 6 }]}>
        <Bob phase={0.6}>
          <CurrencyChip symbol="$" />
        </Bob>
      </View>
      <View style={[styles.floating, { top: 6, right: 0 }]}>
        <Bob phase={2.2}>
          <CurrencyChip symbol="€" />
        </Bob>
      </View>
    </View>
  );
}

function CurrencyChip({ symbol }: { symbol: string }) {
  return (
    <View style={styles.chip}>
      <Text style={textStyle('bodyMediumStrong')}>{symbol}</Text>
    </View>
  );
}

function CurrencyOption({
  symbol,
  name,
  code,
  selected,
  onPress,
}: {
  symbol: string;
  name: string;
  code: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: selected ? withAlpha(colors.primary, 0.1) : colors.surfaceHigh,
          borderColor: selected ? withAlpha(colors.primary, 0.5) : colors.border,
          borderWidth: selected ? borderWidth.focused : borderWidth.hairline,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: selected ? withAlpha(colors.primary, 0.14) : colors.surfaceContainerHighest }]}>
        <Text style={textStyle('symbolLarge', { color: selected ? colors.primary : colors.onSurfaceVariant })}>{symbol}</Text>
      </View>
      <View style={styles.labels}>
        <Text style={textStyle('bodySmallStrong', { color: selected ? colors.onSurface : colors.onSurfaceVariant })}>{name}</Text>
        <Text style={textStyle('labelSmall')}>{code}</Text>
      </View>
      {selected ? <MaterialIcons name="check-circle" size={sizes.checkIcon} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  chipsBox: {
    width: 190,
    height: 150,
    alignSelf: 'center',
  },
  chipsCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floating: {
    position: 'absolute',
  },
  chip: {
    width: sizes.currencyChip,
    height: sizes.currencyChip,
    borderRadius: sizes.currencyChip / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    shadowColor: onboardingColors.chipShadow,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  gapTitle: {
    height: spacing.xxl,
  },
  gapSmall: {
    height: spacing.xs,
  },
  gapOptions: {
    height: gaps.sectionTop,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gaps.cardInset,
    paddingVertical: gaps.rowLoose,
    marginBottom: spacing.sm - spacing.xxs / 2,
    borderRadius: radius.tile,
  },
  badge: {
    width: sizes.currencyBadge,
    height: sizes.currencyBadge,
    borderRadius: extraRadius.topBarIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});
