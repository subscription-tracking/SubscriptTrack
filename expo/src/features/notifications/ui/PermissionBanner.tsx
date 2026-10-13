import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';

/**
 * Bildirim izni kapalıyken gösterilen uyarı bandı: açıklama ve cihaz ayarlarını açan "Ayarları aç" düğmesi.
 * Tercihler ekranı ve bildirim merkezi aynı bileşeni kullanır; metin yerine göre değişebilir.
 */
export function PermissionBanner({ message = 'Bildirim izni kapalı; hatırlatmalar gelmeyecek.' }: { message?: string }) {
  useThemeRevision();
  const snackbar = useSnackbar();

  function openSettings() {
    void Linking.openSettings().catch(() => snackbar.show('Cihaz ayarları açılamadı.', 'error'));
  }

  return (
    <View style={styles.band} accessibilityRole="alert">
      <MaterialIcons name="notifications-off" size={sizes.tileIcon} color={colors.error} />
      <Text style={[textStyle('bodySmall', { color: colors.onSurface }), styles.text]}>{message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Ayarları aç" onPress={openSettings} style={styles.action}>
        <Text style={textStyle('label', { color: colors.primary })}>Ayarları aç</Text>
      </Pressable>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.tile,
    backgroundColor: withAlpha(colors.error, 0.12),
  },
  text: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  action: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
}));
