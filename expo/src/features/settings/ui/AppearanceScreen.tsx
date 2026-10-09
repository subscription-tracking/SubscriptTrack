import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';

/**
 * Görünüm. Uygulama yalnızca koyu temayla çalışır ([CURRENT_STATUS](../../../../../docs/CURRENT_STATUS.md));
 * açık ve sistem temaları Flutter'daki gibi sunulmaz, bunu ekran açıkça söyler.
 */
export function AppearanceScreen() {
  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Görünüm" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={textStyle('titleSmall')}>Tema</Text>
          <Text style={textStyle('bodySmall', { color: colors.primary })}>Koyu</Text>
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
            Uygulama şu an yalnızca koyu temayla çalışır. Açık tema ileride eklenebilir.
          </Text>
        </View>
        <Spacer size={sizes.bottomNavHeight} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  content: {
    paddingHorizontal: screenGutter,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.xs,
  },
});
