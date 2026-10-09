import { useEffect, useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, opacity, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textButtonText, textStyle } from '../../../shared/design/typography';
import { AmbientBackground } from '../../../shared/widgets/AmbientBackground';
import { EntranceFade } from '../../../shared/widgets/EntranceFade';
import { CURRENCY_PAGE, ONBOARDING_PAGE_COUNT, ONBOARDING_SLIDES, isCurrencyPage, isLastPage, type OnboardingSlide } from '../domain/slides';
import { DEFAULT_CURRENCY_SYMBOL, readCurrencySymbol, writeCurrencySymbol } from '../data/currencyPreference';
import { useOnboardingFlag } from '../data/onboardingFlag';
import { CurrencyPage } from './CurrencyPage';
import { AnalyticsIllustration } from './illustrations/AnalyticsIllustration';
import { CalendarIllustration } from './illustrations/CalendarIllustration';
import { SubscriptionsIllustration } from './illustrations/SubscriptionsIllustration';

type Page = { kind: 'info'; slide: OnboardingSlide } | { kind: 'currency' };

const PAGES: Page[] = [
  ...ONBOARDING_SLIDES.map((slide): Page => ({ kind: 'info', slide })),
  { kind: 'currency' },
];

/**
 * Tanıtım (Flutter `OnboardingScreen`): üç bilgi sayfası ve para birimi sayfası. Her sayfanın kendi vurgu
 * ve arka plan rengi vardır. "Atla" ve son sayfadaki "Başla" tanıtımı tamamlar: para birimi kaydedilir,
 * bayrak yazılır ve giriş ekranına gidilir. Bildirim izni burada istenmez.
 */
export function OnboardingScreen() {
  const router = useRouter();
  const { markDone } = useOnboardingFlag();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Page>>(null);
  const [index, setIndex] = useState(0);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY_SYMBOL);

  useEffect(() => {
    void readCurrencySymbol().then(setCurrency);
  }, []);

  const accent = isCurrencyPage(index) ? CURRENCY_PAGE.accent : ONBOARDING_SLIDES[index].accent;
  const wash = isCurrencyPage(index) ? CURRENCY_PAGE.wash : ONBOARDING_SLIDES[index].wash;

  async function finish() {
    await writeCurrencySymbol(currency);
    await markDone();
    router.replace('/login' as Href);
  }

  function next() {
    if (isLastPage(index)) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  function renderPage({ item }: ListRenderItemInfo<Page>) {
    return (
      <View style={[styles.page, { width }]}>
        {item.kind === 'info' ? <InfoPage slide={item.slide} /> : <CurrencyPage selected={currency} onSelect={setCurrency} />}
      </View>
    );
  }

  return (
    <AmbientBackground accent={accent} wash={wash}>
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.xxs }]}>
          <View style={[styles.brandDot, { backgroundColor: accent }]} />
          <Text style={textStyle('brand', { color: withAlpha(colors.onSurface, opacity.muted), marginLeft: spacing.xs, letterSpacing: -0.2 })}>
            SubscriptTrack
          </Text>
          <View style={styles.spacer} />
          <Pressable accessibilityRole="button" onPress={() => void finish()} style={styles.skip}>
            <Text style={[textButtonText, { color: withAlpha(accent, 0.72) }]}>Atla</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={PAGES}
          keyExtractor={(_, pageIndex) => `page-${pageIndex}`}
          renderItem={renderPage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          style={styles.pager}
        />

        <View style={styles.dots}>
          {Array.from({ length: ONBOARDING_PAGE_COUNT }, (_, dot) => (
            <View
              key={dot}
              style={[
                styles.dot,
                { width: dot === index ? sizes.dotActive : sizes.dotInactive, backgroundColor: dot === index ? accent : withAlpha(colors.onSurface, opacity.dot) },
              ]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <View style={[styles.buttonShadow, { shadowColor: accent }]}>
            <Pressable
              accessibilityRole="button"
              onPress={next}
              style={({ pressed }) => [styles.button, { backgroundColor: accent }, pressed && styles.pressed]}
            >
              <Text style={textStyle('button', { color: colors.white })}>{isLastPage(index) ? 'Başla' : 'İleri'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AmbientBackground>
  );
}

function InfoPage({ slide }: { slide: OnboardingSlide }) {
  return (
    <View style={styles.info}>
      <EntranceFade>
        {slide.illustration === 'subscriptions' ? (
          <SubscriptionsIllustration />
        ) : slide.illustration === 'calendar' ? (
          <CalendarIllustration />
        ) : (
          <AnalyticsIllustration />
        )}
      </EntranceFade>
      <View style={styles.gapTitle} />
      <EntranceFade delay={80}>
        <Text style={textStyle('headlineSmallStrong', { textAlign: 'center' })}>{slide.title}</Text>
      </EntranceFade>
      <View style={styles.gapBody} />
      <EntranceFade delay={140}>
        <Text style={textStyle('body', { color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: sizes.bodyLine })}>{slide.body}</Text>
      </EntranceFade>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  brandDot: {
    width: sizes.brandDot,
    height: sizes.brandDot,
    borderRadius: sizes.brandDot / 2,
  },
  spacer: {
    flex: 1,
  },
  skip: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sizes.infoGutter,
  },
  gapTitle: {
    height: sizes.illustrationGap,
  },
  gapBody: {
    height: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs - spacing.xxs / 2,
  },
  dot: {
    height: spacing.xs - spacing.xxs / 2,
    borderRadius: spacing.xxs / 2 + 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  buttonShadow: {
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  button: {
    minHeight: sizes.tallButtonHeight,
    borderRadius: sizes.onboardingButtonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});

