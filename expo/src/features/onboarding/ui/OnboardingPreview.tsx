import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type IllustrationKey } from '../domain/slides';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, borderWidth, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

/** Static sample data, not the user's subscriptions or a savings claim. */
export function OnboardingPreview({ kind }: { kind: IllustrationKey }) {
  useThemeRevision();
  return <View style={styles.card}>
    <Text style={textStyle('overline')}>ÖRNEK GÖRÜNÜM</Text>
    {kind === 'subscriptions' ? <View style={styles.group}>
      <SampleRow icon="play-arrow" title="Video aboneliği" note="Aylık" value="₺199,00" />
      <View style={styles.divider} />
      <SampleRow icon="music-note" title="Müzik aboneliği" note="Aylık" value="₺99,00" />
    </View> : kind === 'calendar' ? <View style={styles.group}>
      <View style={styles.row}><View style={styles.date}><Text style={textStyle('caption', { color: colors.primary })}>KAS</Text><Text style={textStyle('title', { color: colors.primary })}>24</Text></View><View style={styles.grow}><Text style={textStyle('bodyStrong')}>Video aboneliği</Text><Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>3 gün sonra yenileniyor</Text></View></View>
      <View style={styles.hint}><MaterialIcons name="notifications-none" size={sizes.tileIcon} color={colors.primary} /><Text style={textStyle('bodySmall')}>Yenilemeden önce hatırla</Text></View>
    </View> : <View style={styles.group}>
      <View><Text style={textStyle('caption')}>Aylık abonelik gideri</Text><Text style={[textStyle('display'), styles.amount]}>₺298,00</Text></View>
      <View style={styles.bar}><View style={styles.barPrimary} /><View style={styles.barSecondary} /></View>
      <View style={styles.row}><Text style={textStyle('caption')}>Video</Text><View style={styles.grow} /><Text style={textStyle('caption')}>Müzik</Text></View>
    </View>}
  </View>;
}
function SampleRow({ icon, title, note, value }: { icon: 'play-arrow' | 'music-note'; title: string; note: string; value: string }) {
  return <View style={styles.row}><View style={styles.icon}><MaterialIcons name={icon} size={sizes.tileIcon} color={colors.primary} /></View><View style={styles.grow}><Text style={textStyle('bodyStrong')}>{title}</Text><Text style={textStyle('caption')}>{note}</Text></View><Text style={textStyle('label')}>{value}</Text></View>;
}
const styles = themedStyles(() => StyleSheet.create({
  card: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceHigh, borderWidth: borderWidth.regular, borderColor: colors.border },
  group: { marginTop: spacing.xl, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  icon: { width: spacing.xxxl, height: spacing.xxxl, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: withAlpha(colors.primary, 0.1) },
  divider: { height: borderWidth.hairline, backgroundColor: colors.border },
  date: { minWidth: spacing.huge, padding: spacing.xs, alignItems: 'center', borderRadius: radius.md, backgroundColor: withAlpha(colors.primary, 0.1) },
  hint: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: borderWidth.hairline, borderTopColor: colors.border },
  amount: { marginTop: spacing.xxs },
  bar: { flexDirection: 'row', gap: spacing.xxs, height: spacing.xs, borderRadius: radius.pill, overflow: 'hidden' },
  barPrimary: { flex: 2, backgroundColor: colors.primary },
  barSecondary: { flex: 1, backgroundColor: withAlpha(colors.primary, 0.35) },
}));
