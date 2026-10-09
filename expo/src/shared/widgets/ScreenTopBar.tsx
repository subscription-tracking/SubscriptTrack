import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { colors, screenGutter, sizes, spacing } from '../design/tokens';
import { textStyle } from '../design/typography';

/** Alt ekranların üst çubuğu: geri düğmesi (48 px dokunma alanı) ve başlık. */
export function ScreenTopBar({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  const router = useRouter();
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
      </Pressable>
      <Text style={[textStyle('title'), styles.title]}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.action}>
          <Text style={textStyle('label', { color: colors.primary })}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    flex: 1,
  },
  action: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: screenGutter - 8,
    height: sizes.minTouchTarget,
    marginBottom: spacing.md,
  },
  backButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
