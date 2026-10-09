import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatLongDate } from '../../../../core/format/date';
import { type CivilDate } from '../../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, daysUntilRenewal, type Subscription } from '../../domain/subscription';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Flutter `DetailNextPaymentCard`: sağda 4 px durum çizgisi; gün sayısı rozetinde "BUGÜN" ya da "GÜN KALDI/GECİKTİ". */
export function NextPaymentPanel({ subscription, today }: { subscription: Subscription; today: CivilDate }) {
  const days = daysUntilRenewal(subscription, today);
  if (days === null || !subscription.nextRenewalDate) return null;
  const tone = days < 0 ? colors.error : days <= 3 ? colors.tertiary : days <= 7 ? statusColors.warning : colors.primary;
  return (
    <View style={styles.nextCard}>
      <View style={[styles.stripe, { backgroundColor: tone }]} />
      <View style={styles.nextRow}>
        <View style={styles.nextText}>
          <Text style={textStyle('labelSmallStrong', { letterSpacing: 1 })}>SONRAKİ ÖDEME</Text>
          <Text style={[textStyle('detailDate'), styles.nextDate]}>{formatLongDate(subscription.nextRenewalDate)}</Text>
        </View>
        {days === 0 ? (
          <View style={[styles.todayBadge, badgeTone(tone)]}>
            <Text style={textStyle('topBarTitle', { color: tone, letterSpacing: 0.5, fontSize: 16 })}>BUGÜN</Text>
          </View>
        ) : (
          <View style={[styles.dayBadge, badgeTone(tone)]}>
            <Text style={textStyle('dayCount', { color: tone, lineHeight: sizes.dayCountLine })}>{String(Math.abs(days))}</Text>
            <Text style={textStyle('dayCaption', { color: tone, letterSpacing: 0.5 })}>{days < 0 ? 'GÜN GECİKTİ' : 'GÜN KALDI'}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function badgeTone(tone: string) {
  return { backgroundColor: withAlpha(tone, 0.12), borderColor: withAlpha(tone, 0.3) };
}

/** Flutter `DetailGridCategoryAndCycle`: kategori ve yenileme sıklığı kutuları. */
export function InfoGrid({ subscription }: { subscription: Subscription }) {
  return (
    <View style={styles.grid}>
      <InfoTile title="KATEGORİ" value={CATEGORY_LABELS[subscription.category]} icon="movie-filter" color={colors.primary} />
      <View style={styles.gridGap} />
      <InfoTile title="YENİLEME SIKLIĞI" value={BILLING_CYCLE_LABELS[subscription.billingCycle]} icon="update" color={colors.tertiary} />
    </View>
  );
}

function InfoTile({ title, value, icon, color }: { title: string; value: string; icon: MaterialIconName; color: string }) {
  return (
    <View style={styles.infoTile}>
      <Text style={textStyle('caption10Strong', { letterSpacing: 1 })}>{title}</Text>
      <View style={styles.infoRow}>
        <View style={[styles.infoCircle, { backgroundColor: withAlpha(color, 0.15) }]}>
          <MaterialIcons name={icon} size={sizes.detailCardIcon} color={color} />
        </View>
        <Text numberOfLines={1} style={[textStyle('bodySmallStrong'), styles.infoValue]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/** Flutter `DetailPaymentMethodSection`: ödeme yöntemi adı ya da "Belirtilmedi", "Değiştir" bağlantısı. */
export function PaymentMethodSection({ method, onChange }: { method: string | null; onChange: () => void }) {
  return (
    <Section caption="ÖDEME YÖNTEMİ">
      <Card>
        <View style={styles.methodRow}>
          <View style={styles.methodBox}>
            <MaterialIcons name="credit-card" size={sizes.detailMethodIcon} color={colors.secondary} />
          </View>
          <View style={styles.methodText}>
            <Text style={textStyle('bodySmallStrong')}>{method ?? 'Belirtilmedi'}</Text>
            <Text style={textStyle('caption12', { marginTop: spacing.xxs / 2 })}>
              {method ? 'Kayıtlı ödeme yöntemi' : 'Ödeme yöntemi seçilmedi'}
            </Text>
          </View>
          <CompactLink label="Değiştir" onPress={onChange} />
        </View>
      </Card>
    </Section>
  );
}

/** Flutter `DetailReminderSection`: etkin hatırlatma günleri çip olarak; yoksa kapalı mesajı. */
export function ReminderSection({ rules, onEdit }: { rules: unknown[]; onEdit: () => void }) {
  const days = enabledRuleDays(rules);
  return (
    <Section caption="HATIRLATMALAR" action={<CompactLink label="Düzenle" onPress={onEdit} />}>
      <Card>
        {days.length === 0 ? (
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Bu abonelik için hatırlatma kapalı.</Text>
        ) : (
          <View style={styles.chips}>
            {days.map((value) => (
              <View key={value} style={styles.reminderChip}>
                <Text style={textStyle('caption12Strong', { color: colors.primary })}>
                  {value === 0 ? 'Aynı gün' : `${value} gün önce`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Section>
  );
}

/** Etkin kuralların artan gün listesi. Hatalı biçimli kayıtlar atlanır. */
function enabledRuleDays(rules: unknown[]): number[] {
  const values = rules.flatMap((rule) => {
    if (typeof rule !== 'object' || rule === null) return [];
    const { daysBefore, enabled } = rule as { daysBefore?: unknown; enabled?: unknown };
    return enabled === true && typeof daysBefore === 'number' ? [daysBefore] : [];
  });
  return [...new Set(values)].sort((a, b) => a - b);
}

export function Section({ caption, action, children }: { caption: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.captionRow}>
        <Text style={textStyle('labelSmallStrong', { letterSpacing: 1 })}>{caption}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, padding = spacing.md }: { children: ReactNode; padding?: number }) {
  return <View style={[styles.card, { padding }]}>{children}</View>;
}

export function CompactLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.compact}>
      <Text style={textStyle('compactLink')}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nextCard: {
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: sizes.stripeWidth,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gaps.rowLoose + spacing.xs - 2,
    paddingVertical: spacing.md + spacing.xxs / 2,
  },
  nextText: {
    flex: 1,
  },
  nextDate: {
    marginTop: spacing.xxs,
  },
  todayBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: gaps.rowLoose,
    borderRadius: radius.tile,
    borderWidth: borderWidth.regular,
  },
  dayBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - spacing.xxs / 2,
    borderRadius: radius.tile,
    borderWidth: borderWidth.regular,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
  },
  gridGap: {
    width: gaps.sectionInner,
  },
  infoTile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: gaps.sectionInner - 2,
  },
  infoCircle: {
    width: sizes.detailTileCircle,
    height: sizes.detailTileCircle,
    borderRadius: sizes.detailTileCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoValue: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.xxs,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodBox: {
    width: sizes.paymentMethodBox,
    height: sizes.paymentMethodBox,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  methodText: {
    flex: 1,
    marginLeft: gaps.rowLoose,
  },
  compact: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gaps.hint,
  },
  reminderChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
});
