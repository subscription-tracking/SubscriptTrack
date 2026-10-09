import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { zoneToday, deviceTimeZone } from '../../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { type Subscription, type SubscriptionStatus } from '../../domain/subscription';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Flutter `DetailActionButtonsSection`: yenileme onayı (vadesi gelmişse), duraklat/devam ve arşivle,
 * iptal. Durum değişiklikleri mevcut veri katmanından geçer; iptal ayrı iptal ekranına gider.
 */
export function DetailActions({
  subscription,
  busy,
  onChange,
  onRenew,
  onCancel,
}: {
  subscription: Subscription;
  busy: boolean;
  onChange: (to: SubscriptionStatus) => void;
  onRenew: () => void;
  /** İptal tarih isteyen ayrı ekrana yönlendirilir (USER_FLOWS §9). */
  onCancel: () => void;
}) {
  const isDue = subscription.status === 'active' && isDueNow(subscription);
  const paused = subscription.status === 'paused';

  return (
    <View style={styles.wrap}>
      {isDue ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onRenew}
          style={({ pressed }) => [styles.filled, pressed && styles.pressed, busy && styles.disabled]}
        >
          <MaterialIcons name="check-circle-outline" size={sizes.buttonIcon} color={colors.onPrimary} />
          <Text style={[textStyle('button', { color: colors.onPrimary }), styles.label]}>Ödendi ve yenilendi</Text>
        </Pressable>
      ) : null}
      {isDue ? <View style={styles.gap} /> : null}

      <View style={styles.row}>
        <ActionButton
          icon={paused ? 'play-arrow' : 'pause'}
          label={paused ? 'Devam Ettir' : 'Duraklat'}
          disabled={busy}
          onPress={() => onChange(paused ? 'active' : 'paused')}
        />
        <View style={styles.rowGap} />
        <ActionButton icon="archive" label="Arşivle" disabled={busy} onPress={() => onChange('archived')} />
      </View>
      <View style={styles.gap} />

      <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
        <MaterialIcons name="cancel" size={sizes.cancelIcon} color={colors.error} />
        <Text style={[textStyle('buttonStrong'), styles.label]}>Aboneliği İptal Et</Text>
      </Pressable>
    </View>
  );
}

/** Flutter `DetailActionButtonsSection` tarafındaki "vadesi geldi": kalan gün sıfır veya geçmiş. */
function isDueNow(subscription: Subscription): boolean {
  const today = zoneToday(deviceTimeZone());
  const next = subscription.nextRenewalDate;
  if (!next) return false;
  return next.year * 10000 + next.month * 100 + next.day <= today.year * 10000 + today.month * 100 + today.day;
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: MaterialIconName;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.outlined, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <MaterialIcons name={icon} size={sizes.buttonIcon} color={colors.onSurface} />
      <Text style={[textStyle('button'), styles.label]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  rowGap: {
    width: gaps.rowLoose - 2,
  },
  gap: {
    height: gaps.rowLoose - 2,
  },
  label: {
    marginLeft: spacing.xs,
  },
  filled: {
    minHeight: sizes.detailButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.tile,
    backgroundColor: colors.primary,
  },
  outlined: {
    flex: 1,
    minHeight: sizes.detailButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
  },
  cancel: {
    minHeight: sizes.primaryButtonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.tile,
    backgroundColor: withAlpha(colors.error, 0.08),
    borderWidth: borderWidth.hairline,
    borderColor: withAlpha(colors.error, 0.3),
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
