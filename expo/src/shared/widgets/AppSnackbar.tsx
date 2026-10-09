import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { spacing, radius } from '../design/tokens';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../design/tokens';
import { fontFamily } from '../design/typography';

/**
 * Flutter `ScaffoldMessenger.showSnackBar` karşılığı. Varsayılan ton inverseSurface,
 * `error` ton hata rengi, `primary` ton marka rengi zemin kullanır. Metin koyu
 * (onInverseSurface) renktedir, Flutter ile aynı. Mesaj 4 saniye sonra kapanır.
 */

export type SnackbarTone = 'default' | 'error' | 'primary';

interface SnackbarContextValue {
  show: (message: string, tone?: SnackbarTone) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const DURATION_MS = 4000;

export function AppSnackbarProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ id: number; message: string; tone: SnackbarTone } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const idRef = useRef(0);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setCurrent(null);
    });
  }, [opacity]);

  const show = useCallback(
    (message: string, tone: SnackbarTone = 'default') => {
      idRef.current += 1;
      setCurrent({ id: idRef.current, message, tone });
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    },
    [opacity],
  );

  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(hide, DURATION_MS);
    return () => clearTimeout(timer);
  }, [current, hide]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <SnackbarContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {current ? (
          <Animated.View pointerEvents="box-none" style={[styles.host, { opacity }]}>
            <Pressable
              accessibilityRole="alert"
              onPress={hide}
              style={[styles.snackbar, toneStyle[current.tone]]}
            >
              <Text style={styles.message}>{current.message}</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar, AppSnackbarProvider içinde kullanılmalı.');
  return context;
}

const toneStyle = StyleSheet.create({
  default: { backgroundColor: colors.inverseSurface },
  error: { backgroundColor: colors.error },
  primary: { backgroundColor: colors.primary },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  host: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  snackbar: {
    borderRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    fontFamily,
    fontSize: 14,
    color: colors.onInverseSurface,
  },
});
