import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../design/tokens';
import { textStyle } from '../design/typography';
import { LockAwareModal } from './LockAwareModal';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface ActionSheetItem {
  key: string;
  label: string;
  icon: MaterialIconName;
  /** Satırın sağında küçük açıklama (ör. "Kayıt listede kalır"). */
  hint?: string;
  /** `danger`: yıkıcı eylem, hata renginde. */
  tone?: 'default' | 'danger';
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Alt sayfa eylem menüsü: başlık, ikonlu satırlar, yıkıcı eylem hata renginde ve en altta. Kilit
 * ekranı açılınca kapanır (`LockAwareModal`). Her satır en az 48 px dokunma alanıdır.
 */
export function ActionSheet({
  visible,
  title,
  items,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: readonly ActionSheetItem[];
  onClose: () => void;
}) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  return (
    <LockAwareModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Menüyü kapat" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]} accessibilityViewIsModal accessibilityLabel={title}>
          <View style={styles.handle} />
          <Text style={[textStyle('heading'), styles.title]} numberOfLines={1}>{title}</Text>
          {items.map((item, index) => {
            const danger = item.tone === 'danger';
            const color = item.disabled ? colors.disabledText : danger ? colors.error : colors.onSurface;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: Boolean(item.disabled) }}
                disabled={item.disabled}
                onPress={() => { onClose(); item.onPress(); }}
                style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
              >
                <MaterialIcons name={item.icon} size={sizes.rowActionIcon} color={color} />
                <Text style={[textStyle('bodyStrong', { color }), styles.label]}>{item.label}</Text>
                {item.hint ? <Text style={[textStyle('caption'), styles.hint]} numberOfLines={1}>{item.hint}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </LockAwareModal>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: withAlpha(colors.scrim, 0.55) },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  handle: {
    alignSelf: 'center',
    width: sizes.sheetHandleWidth,
    height: sizes.sheetHandleHeight,
    borderRadius: radius.xs,
    backgroundColor: colors.controlBorder,
    marginBottom: spacing.sm,
  },
  title: { marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: sizes.minTouchTarget, gap: spacing.sm },
  rowDivider: { borderTopWidth: borderWidth.hairline, borderTopColor: colors.border },
  pressed: { opacity: 0.7 },
  label: { flexShrink: 1 },
  hint: { marginLeft: 'auto', color: colors.onSurfaceVariant, maxWidth: '45%' },
}));
