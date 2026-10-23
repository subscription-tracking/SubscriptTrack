import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { StyleSheet, View } from 'react-native';

import { colors, spacing, screenGutter } from '../design/tokens';
import { AsyncStateView } from './AsyncStateView';

/**
 * Henüz uygulanmamış sekmeler için boş durum ekranı. Gerçek içerik geldiğinde
 * ilgili sekme bu bileşenin yerine kendi ekranını koyar.
 */
export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  useThemeRevision();
  return (
    <View style={styles.screen}>
      <AsyncStateView<null> state={{ status: 'empty', title, description }}>{() => null}</AsyncStateView>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: screenGutter,
    paddingTop: spacing.xl,
  },
}));
