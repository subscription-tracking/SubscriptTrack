import { useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, type ListRenderItemInfo, useWindowDimensions } from 'react-native';

import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { TextLink } from '../../../shared/widgets/TextLink';
import { ONBOARDING_SLIDES, isLastSlide, type OnboardingSlide } from '../domain/slides';
import { useOnboardingFlag } from '../data/onboardingFlag';

/**
 * Tanıtım (üç sayfa). "Atla" ve son sayfadaki "Başla" tanıtımı tamamlar ve giriş ekranına götürür.
 * Bildirim izni burada istenmez.
 */
export function OnboardingScreen() {
  const router = useRouter();
  const { markDone } = useOnboardingFlag();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [index, setIndex] = useState(0);

  async function finish() {
    await markDone();
    router.replace('/login' as Href);
  }

  function next() {
    if (isLastSlide(index)) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  function renderSlide({ item }: ListRenderItemInfo<OnboardingSlide>) {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.glow} />
        <Text style={textStyle('headline', { textAlign: 'center' })}>{item.title}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'center' })}>{item.body}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        {isLastSlide(index) ? null : <TextLink label="Atla" align="end" onPress={() => void finish()} />}
      </View>

      <FlatList
        ref={listRef}
        data={[...ONBOARDING_SLIDES]}
        keyExtractor={(item) => item.title}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        style={styles.list}
      />

      <View style={styles.dots}>
        {ONBOARDING_SLIDES.map((slide, dot) => (
          <Pressable
            key={slide.title}
            accessibilityRole="button"
            accessibilityLabel={`${dot + 1}. sayfa`}
            onPress={() => listRef.current?.scrollToIndex({ index: dot, animated: true })}
            style={[styles.dot, dot === index && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={isLastSlide(index) ? 'Başla' : 'İleri'} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  topRow: {
    paddingHorizontal: screenGutter,
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenGutter,
    gap: spacing.md,
  },
  glow: {
    width: sizes.glowOrbSize,
    height: sizes.glowOrbSize,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
    marginBottom: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  dot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.outline,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: spacing.md,
  },
  footer: {
    paddingHorizontal: screenGutter,
    marginTop: spacing.xl,
  },
});
