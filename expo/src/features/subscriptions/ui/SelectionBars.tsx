import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';

/** Çoklu seçimin üst çubuğu: kapat, "N seçildi" ve hepsini seç / temizle. */
export function SelectionTopBar({ count, allSelected, onClose, onToggleAll }: { count: number; allSelected: boolean; onClose: () => void; onToggleAll: () => void }) {
  useThemeRevision();
  return (
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel="Seçimden çık" onPress={onClose} style={styles.close}>
        <Ionicons name="close" size={sizes.chevronIcon + 2} color={colors.onSurface} />
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={textStyle('title', { flex: 1 })}>{`${count} seçildi`}</Text>
      <Pressable accessibilityRole="button" onPress={onToggleAll} style={styles.toggle}>
        <Text style={textStyle('label', { color: colors.primary })}>{allSelected ? 'Seçimi temizle' : 'Tümünü seç'}</Text>
      </Pressable>
    </View>
  );
}

/** Liste başlığının altında tek satır: "Aylık toplam" ve tutar. */
export function MonthlyTotalRow({ amount, hiddenNote }: { amount: string; hiddenNote?: string }) {
  useThemeRevision();
  return (
    <View style={styles.total}>
      <View style={styles.totalLine}>
        <Text style={textStyle('body', { color: colors.onSurfaceVariant })}>Aylık toplam</Text>
        <Text style={textStyle('label', { flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] })}>{amount}</Text>
      </View>
      {hiddenNote ? <Text style={textStyle('caption', { marginTop: spacing.xxs })}>{hiddenNote}</Text> : null}
    </View>
  );
}

/** Seçim modunda listenin altında yüzen çubuk: seçili sayısı ve kırmızı "Sil" eylemi. */
export function SelectionActionBar({ count, busy, bottom, onDelete }: { count: number; busy: boolean; bottom: number; onDelete: () => void }) {
  useThemeRevision();
  return (
    <View style={[styles.bar, { bottom }]}>
      <View style={styles.barText}>
        <Text style={textStyle('bodyStrong')}>{`${count} abonelik`}</Text>
        <Text style={textStyle('caption')}>Silinen kayıt geri alınamaz</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${count} seçili aboneliği sil`}
        accessibilityState={{ disabled: busy || count === 0 }}
        disabled={busy || count === 0}
        onPress={onDelete}
        style={({ pressed }) => [styles.delete, (busy || count === 0) && styles.deleteOff, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.onErrorContainer} />
        <Text style={textStyle('label', { color: colors.onErrorContainer })}>Sil</Text>
      </Pressable>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  close: { width: sizes.iconButton, height: sizes.iconButton, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerHighest },
  total: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  totalLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  toggle: { minHeight: sizes.minTouchTarget, justifyContent: 'center' },
  bar: { position: 'absolute', left: spacing.lg, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.sm, borderRadius: radius.lg, borderWidth: borderWidth.hairline, borderColor: colors.border, backgroundColor: colors.surfaceHigh },
  barText: { flex: 1, minWidth: 0 },
  delete: { minHeight: sizes.minTouchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: borderWidth.hairline, borderColor: withAlpha(colors.onErrorContainer, 0.35), backgroundColor: colors.errorContainer },
  deleteOff: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
}));
