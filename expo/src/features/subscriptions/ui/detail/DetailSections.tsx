import { usePermissionQuery } from '../../../notifications/data/notificationPermission';
import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatLongDate } from '../../../../core/format/date';
import { type CivilDate } from '../../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, daysUntilRenewal, type Subscription } from '../../domain/subscription';
import { advancedRenewalDate } from '../../domain/renewalOverdue';
import { isNotStarted } from '../../domain/activeSelectors';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Flutter `DetailNextPaymentCard`: sağda 4 px durum çizgisi; gün sayısı rozetinde "BUGÜN" ya da "GÜN KALDI/GECİKTİ". */
export function NextPaymentPanel({ subscription, today }: { subscription: Subscription; today: CivilDate }) {
  useThemeRevision();
  const days = daysUntilRenewal(subscription, today);
  if (days === null || !subscription.nextRenewalDate) return null;
  const tone = days < 0 ? colors.error : days <= 3 ? colors.tertiary : days <= 7 ? statusColors.warning : colors.primary;
  const upcoming = days < 0 ? advancedRenewalDate(subscription, today) : null;
  return (
    <View style={styles.nextCard}>
      <View style={[styles.stripe, { backgroundColor: tone }]} />
      <View style={styles.nextRow}>
        <View style={styles.nextText}>
          <Text style={textStyle('captionStrong', { color: colors.onSurfaceVariant, letterSpacing: 1 })}>{days < 0 ? 'GECİKMİŞ VADE' : 'SONRAKİ ÖDEME'}</Text>
          <Text style={[textStyle('heading'), styles.nextDate]}>{formatLongDate(subscription.nextRenewalDate)}</Text>
          {upcoming ? <Text style={textStyle('caption')}>{`Sonraki döngü: ${formatLongDate(upcoming)} (tahmini)`}</Text> : null}
          {isNotStarted(subscription, today) ? <Text style={textStyle('caption')}>Henüz başlamadı</Text> : null}
        </View>
        {days === 0 ? (
          <View style={[styles.todayBadge, badgeTone(tone)]}>
            <Text style={textStyle('heading', { color: tone, letterSpacing: 0.5, fontSize: 16 })}>BUGÜN</Text>
          </View>
        ) : (
          <View style={[styles.dayBadge, badgeTone(tone)]}>
            <Text style={textStyle('title', { color: tone, lineHeight: sizes.dayCountLine })}>{String(Math.abs(days))}</Text>
            <Text style={textStyle('caption', { color: tone, letterSpacing: 0.5 })}>{days < 0 ? 'GÜN GECİKTİ' : 'GÜN KALDI'}</Text>
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
  useThemeRevision();
  return (
    <View style={styles.grid}>
      <InfoTile title="KATEGORİ" value={CATEGORY_LABELS[subscription.category]} icon="movie-filter" color={colors.primary} />
      <View style={styles.gridGap} />
      <InfoTile title="YENİLEME SIKLIĞI" value={BILLING_CYCLE_LABELS[subscription.billingCycle]} icon="update" color={colors.tertiary} />
    </View>
  );
}

function InfoTile({ title, value, icon, color }: { title: string; value: string; icon: MaterialIconName; color: string }) {
  useThemeRevision();
  return (
    <View style={styles.infoTile}>
      <Text style={textStyle('captionStrong', { color: colors.onSurfaceVariant, letterSpacing: 1 })}>{title}</Text>
      <View style={styles.infoRow}>
        <View style={[styles.infoCircle, { backgroundColor: withAlpha(color, 0.15) }]}>
          <MaterialIcons name={icon} size={sizes.detailCardIcon} color={color} />
        </View>
        <Text numberOfLines={1} style={[textStyle('label'), styles.infoValue]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/** Flutter `DetailPaymentMethodSection`: ödeme yöntemi adı ya da "Belirtilmedi", "Değiştir" bağlantısı. */
export function PaymentMethodSection({ method, onChange }: { method: string | null; onChange: () => void }) {
  useThemeRevision();
  return (
    <Section caption="ÖDEME YÖNTEMİ">
      <Card>
        <View style={styles.methodRow}>
          <View style={styles.methodBox}>
            <MaterialIcons name="credit-card" size={sizes.detailMethodIcon} color={colors.secondary} />
          </View>
          <View style={styles.methodText}>
            <Text style={textStyle('label')}>{method ?? 'Belirtilmedi'}</Text>
            <Text style={textStyle('caption', { marginTop: spacing.xxs / 2 })}>
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
  useThemeRevision();
  const days = enabledRuleDays(rules);
  const permission = usePermissionQuery().data;
  const notificationsBlocked = permission === 'denied' || permission === 'undetermined';
  return (
    <Section caption="HATIRLATMALAR" action={<CompactLink label="Düzenle" onPress={onEdit} />}>
      <Card>
        {days.length === 0 ? (
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Bu abonelik için hatırlatma kapalı.</Text>
        ) : (
          <>
            {notificationsBlocked ? (
              <Text style={textStyle('bodySmall', { color: colors.error })}>Bildirim izni verilmediği için bu hatırlatmalar gelmeyecek. Ayarlar › Bildirimler&apos;den izin ver.</Text>
            ) : (
              <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Yenileme öncesinde bu zamanlarda bildirim gelir:</Text>
            )}
            <View style={styles.chips}>
              {days.map((value) => (
                <View key={value} style={styles.reminderChip}>
                  <Text style={textStyle('captionStrong', { color: colors.primary })}>
                    {value === 0 ? 'Yenileme günü' : `${value} gün önce`}
                  </Text>
                </View>
              ))}
            </View>
          </>
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
  useThemeRevision();
  return (
    <View style={styles.section}>
      <View style={styles.captionRow}>
        <Text style={textStyle('captionStrong', { color: colors.onSurfaceVariant, letterSpacing: 1 })}>{caption}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, padding = spacing.md }: { children: ReactNode; padding?: number }) {
  useThemeRevision();
  return <View style={[styles.card, { padding }]}>{children}</View>;
}

export function CompactLink({ label, onPress }: { label: string; onPress: () => void }) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.compact}>
      <Text style={textStyle('label', { color: colors.primary })}>{label}</Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  nextCard: {
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  // Kart köşesinde kırpılmasın diye şerit içeride, sol kenarda ve dikey olarak kısaltılmış.
  stripe: {
    position: 'absolute',
    left: spacing.xs,
    top: spacing.md,
    bottom: spacing.md,
    width: sizes.stripeWidth,
    borderRadius: radius.pill,
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
}));
