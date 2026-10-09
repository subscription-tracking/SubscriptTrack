import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, type LayoutChangeEvent } from 'react-native';

/**
 * Flutter `EntranceFade`: ilk çizimde 550 ms içinde solarak ve yukarı kayarak gelir.
 * Kayma, çocuğun yüksekliğinin %6'sıdır (Flutter `Offset(0, 0.06)` ile aynı).
 * [delay] milisaniye cinsindendir.
 */
export function EntranceFade({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 550,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
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
