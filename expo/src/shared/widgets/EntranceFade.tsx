import { useThemeRevision } from '../design/useThemeRevision';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, type LayoutChangeEvent } from 'react-native';

/**
 * Flutter `EntranceFade`: ilk çizimde 550 ms içinde solarak ve yukarı kayarak gelir.
 * Kayma, çocuğun yüksekliğinin %6'sıdır (Flutter `Offset(0, 0.06)` ile aynı).
 * [delay] milisaniye cinsindendir.
 */
export function EntranceFade({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  useThemeRevision();
  const [progress] = useState(() => new Animated.Value(0));
  const [height, setHeight] = useState(0);

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    let animation: Animated.CompositeAnimation | undefined;
    const applyPreference = (reduce: boolean) => {
      animation?.stop();
      if (reduce) {
        progress.setValue(1);
      } else {
        animation = Animated.timing(progress, {
          toValue: 1,
          duration: 550,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
        animation.start();
      }
    };
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduce) => {
      preferenceChanged = true;
      applyPreference(reduce);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (mounted && !preferenceChanged) applyPreference(reduce);
    }).catch(() => { if (mounted && !preferenceChanged) progress.setValue(1); });
    return () => { mounted = false; listener.remove(); animation?.stop(); };
  }, [delay, progress]);

  const onLayout = (event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height);

  return (
    <Animated.View
      onLayout={onLayout}
      style={{
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [height * 0.06, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
