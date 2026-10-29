import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { colors, sizes, spacing } from '../design/tokens';
import { textStyle } from '../design/typography';
import { HeaderShell } from './HeaderShell';

/**
 * Geri düğmeli alt ekran barı. Kabuk (güvenli alan, kenar boşluğu, yükseklik) `HeaderShell` ile `TopBar` ile
 * aynıdır; başlık rolü de aynıdır (`topBarTitle`). Geri düğmesi, glifi kenar boşluğuna hizalayacak şekilde
 * negatif sol boşlukla yerleşir.
 */
export function ScreenTopBar({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  useThemeRevision();
  const router = useRouter();
  return (
    <HeaderShell style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
      </Pressable>
      <Text accessibilityRole="header" style={[textStyle('heading'), styles.title]}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.action}>
          <Text style={textStyle('label', { color: colors.primary })}>{action.label}</Text>
        </Pressable>
      ) : null}
    </HeaderShell>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  title: {
    flex: 1,
  },
  action: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  topBar: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backButton: {
    // Glif (24) 48 px alanın ortasında; negatif boşlukla glifin sol kenarı ekran kenar boşluğuna oturur.
    marginLeft: -spacing.sm,
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
