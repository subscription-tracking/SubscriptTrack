import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { pressFeedback } from '../../../shared/haptics';
import { LockAwareModal } from '../../../shared/widgets/LockAwareModal';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { useConfirmedRenew } from '../../subscriptions/ui/useConfirmedRenew';
import { type AttentionItem } from '../domain/homeSummary';
import { SubscriptionRowCard } from './SubscriptionRowCard';

/** Satırın alt metni: gecikmişse "N gün gecikti · tutar", bugünse "Bugün yenileniyor · tutar". */
export function attentionSubtitle(item: AttentionItem): string {
  const amount = formatCurrency(item.subscription.amount, item.subscription.currency);
  const date = item.subscription.nextRenewalDate ? ` · ${formatLongDate(item.subscription.nextRenewalDate)}` : '';
  return item.daysOverdue > 0 ? `${item.daysOverdue} gün gecikti${date} · ${amount}` : `Bugün yenileniyor${date} · ${amount}`;
}

/**
 * Vadesi gelmiş kayıtlar: ana sayfada hero kartının altındaki çip satırında küçük bir çip ("3 ödeme gecikti ›").
 * Dokununca alt sayfa açılır; liste satır içi "Ödendi" onayıyla orada yönetilir, ana sayfa yapısını itmez. Kayıt yoksa
 * hiçbir şey çizmez.
 */
export function AttentionSection({
  items,
  today,
  onOpen,
  onMore,
}: {
  items: readonly AttentionItem[];
  today: CivilDate;
  onOpen: (id: string) => void;
  onMore: () => void;
}) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { confirm, pendingId } = useConfirmedRenew(today);
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const label = `${items.length} ödeme ${items.every((item) => item.daysOverdue > 0) ? 'gecikti' : 'bekliyor'}`;
  const close = () => setOpen(false);

  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={({ pressed }) => [styles.strip, pressed && styles.pressed]}>
        <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
        <Text style={textStyle('caption', { color: colors.onErrorContainer })}>{`${label} ›`}</Text>
      </Pressable>
      <LockAwareModal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.root}>
          <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Listeyi kapat" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md, maxHeight: height - insets.top }]} accessibilityViewIsModal accessibilityLabel={label}>
            <View style={styles.handle} />
            <Text accessibilityRole="header" style={textStyle('heading', { marginBottom: spacing.sm })}>{label}</Text>
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <SubscriptionRowCard
                  key={item.subscription.id}
                  subscription={item.subscription}
                  subtitle={attentionSubtitle(item)}
                  subtitleColor={item.daysOverdue > 0 ? colors.error : colors.onSurfaceVariant}
                  onPress={() => { close(); onOpen(item.subscription.id); }}
                  trailing={
                    <TonalButton
                      label={pendingId === item.subscription.id ? 'İşleniyor' : 'Ödendi'}
                      disabled={pendingId !== undefined}
                      onPress={() => { pressFeedback(); confirm(item.subscription); }}
                    />
                  }
                />
              ))}
            </ScrollView>
            <Pressable accessibilityRole="link" onPress={() => { close(); onMore(); }} style={styles.more}>
              <Text style={textStyle('label', { color: colors.primary })}>Tüm abonelikleri gör</Text>
            </Pressable>
          </View>
        </View>
      </LockAwareModal>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  strip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: borderWidth.hairline,
    borderColor: withAlpha(colors.onErrorContainer, 0.3),
    backgroundColor: withAlpha(colors.errorContainer, 0.45),
  },
  pressed: { opacity: 0.85 },
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: withAlpha(colors.scrim, 0.55) },
  sheet: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: colors.surface },
  handle: { alignSelf: 'center', width: sizes.sheetHandleWidth, height: sizes.sheetHandleHeight, borderRadius: radius.xs, backgroundColor: colors.controlBorder, marginBottom: spacing.sm },
  list: { gap: gaps.trialCard },
  more: { minHeight: sizes.minTouchTarget, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
}));
