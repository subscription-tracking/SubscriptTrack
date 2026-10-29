import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radius, sizes, spacing } from '../design/tokens';
import { buttonText, textStyle } from '../design/typography';

/**
 * Her ekranın veri durumunu tek yerden gösterir: yükleniyor, hata, boş, içerik.
 * AGENTS.md gereği her yeni ekran bu dört durumu planlamak zorundadır.
 * Offline durumu için [OfflineBanner] ile birlikte kullanılır.
 */
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry?: () => void }
  | { status: 'empty'; title: string; description?: string; action?: ReactNode }
  | { status: 'ready'; data: T };

interface AsyncStateViewProps<T> {
  state: AsyncState<T>;
  /** `ready` durumunda çağrılır. */
  children: (data: T) => ReactNode;
  loadingLabel?: string;
}

export function AsyncStateView<T>({
  state,
  children,
  loadingLabel = 'Yükleniyor',
}: AsyncStateViewProps<T>) {
  useThemeRevision();
  switch (state.status) {
    case 'loading':
      return (
        <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel={loadingLabel} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.primary} />
        </View>
      );

    case 'error':
      return (
        <View style={styles.centered}>
          <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.message}>
            <Text style={styles.title}>Bir sorun oluştu</Text>
            <Text style={styles.description}>{state.message}</Text>
          </View>
          {state.onRetry ? (
            <Pressable
              onPress={state.onRetry}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            >
              <Text style={styles.buttonLabel}>Tekrar dene</Text>
            </Pressable>
          ) : null}
        </View>
      );

    case 'empty':
      return (
        <View style={styles.centered}>
          <View accessibilityLiveRegion="polite" style={styles.message}>
            <Text style={styles.title}>{state.title}</Text>
            {state.description ? <Text style={styles.description}>{state.description}</Text> : null}
          </View>
          {state.action}
        </View>
      );

    case 'ready':
      return <>{children(state.data)}</>;
  }
}

const styles = themedStyles(() => StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  message: { alignItems: 'center', gap: spacing.sm },
  title: {
    color: colors.onBackground,
    ...textStyle('bodyStrong'),
    textAlign: 'center',
  },
  description: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    color: colors.onPrimary,
    ...buttonText,
  },
}));
