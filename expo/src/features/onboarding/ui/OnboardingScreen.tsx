import { useEffect, useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { EntranceFade } from '../../../shared/widgets/EntranceFade';
import { DEFAULT_ACTIVE_CURRENCY, type ActiveCurrency } from '../../../core/domain/activeCurrency';
import { ONBOARDING_PAGE_COUNT, ONBOARDING_SLIDES, isLastPage } from '../domain/slides';
import { readDeviceCurrency, writeDeviceCurrency } from '../data/currencyPreference';
import { useOnboardingFlag } from '../data/onboardingFlag';
import { CurrencyPage } from './CurrencyPage';
import { OnboardingPreview } from './OnboardingPreview';

/** Three feature previews and currency selection, with a shared calm layout. */
export function OnboardingScreen() {
  useThemeRevision();
  const router = useRouter();
  const { markDone } = useOnboardingFlag();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<number>>(null);
  const finishing = useRef(false);
  const [index, setIndex] = useState(0);
  const [currency, setCurrency] = useState<ActiveCurrency>(DEFAULT_ACTIVE_CURRENCY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void readDeviceCurrency().then(value => { if (active && value) setCurrency(value); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  async function finish() {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    setError(null);
    try {
      await writeDeviceCurrency(currency);
      await markDone();
      router.replace('/login' as Href);
    } catch {
      setError('Tercihin kaydedilemedi. Tekrar deneyebilirsin.');
    } finally { finishing.current = false; setBusy(false); }
  }
  function next() {
    if (isLastPage(index)) { void finish(); return; }
    const target = index + 1;
    setIndex(target);
    list.current?.scrollToIndex({ index: target, animated: true });
  }
  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.topBar}>
        <View style={styles.brandDot} />
        <Text style={textStyle('label')}>SubscriptTrack</Text>
        <View style={styles.spacer} />
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void finish()} style={styles.skip}>
          <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>Atla</Text>
        </Pressable>
      </View>
      <FlatList
        ref={list}
        data={[0, 1, 2, 3]}
        keyExtractor={value => String(value)}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        getItemLayout={(_, page) => ({ length: width, offset: page * width, index: page })}
        onMomentumScrollEnd={event => setIndex(Math.max(0, Math.min(ONBOARDING_PAGE_COUNT - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}
        extraData={currency}
        renderItem={({ item }) => (
          <ScrollView style={{ width }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
            {item === ONBOARDING_SLIDES.length ? <CurrencyPage selected={currency} onSelect={setCurrency} /> : (
              <>
                <View style={styles.preview}><OnboardingPreview kind={ONBOARDING_SLIDES[item].illustration} /></View>
                <View style={styles.copy}><EntranceFade>
                  <Text accessibilityRole="header" style={textStyle('headline')}>{ONBOARDING_SLIDES[item].title}</Text>
                  <Text style={[textStyle('body', { color: colors.onSurfaceVariant }), styles.body]}>{ONBOARDING_SLIDES[item].body}</Text>
                </EntranceFade></View>
              </>
            )}
          </ScrollView>
        )}
      />
      <View style={styles.footer}>
        <View accessibilityLabel={`Adım ${index + 1} / ${ONBOARDING_PAGE_COUNT}`} style={styles.progress}>
          {Array.from({ length: ONBOARDING_PAGE_COUNT }, (_, step) => <View key={step} style={[styles.dot, step === index && styles.activeDot]} />)}
          <Text style={[textStyle('caption'), styles.counter]}>{index + 1} / {ONBOARDING_PAGE_COUNT}</Text>
        </View>
        {error ? <Text accessibilityRole="alert" style={textStyle('bodySmall', { color: colors.error })}>{error}</Text> : null}
        <PrimaryButton label={isLastPage(index) ? 'Başlayalım' : 'Devam et'} loading={busy} onPress={next} />
      </View>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.xs },
  brandDot: { width: sizes.brandDot, height: sizes.brandDot, borderRadius: radius.pill, backgroundColor: colors.primary },
  spacer: { flex: 1 },
  skip: { minHeight: sizes.minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.xs },
  page: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  preview: { minHeight: spacing.huge * 5, justifyContent: 'center', marginBottom: spacing.xxxl },
  body: { marginTop: spacing.md, lineHeight: sizes.bodyLine },
  copy: { minHeight: spacing.huge * 3 },
  footer: { paddingHorizontal: spacing.xl, gap: spacing.md },
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  dot: { height: spacing.xxs, width: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.border },
  activeDot: { width: spacing.xl, backgroundColor: colors.primary },
  counter: { marginLeft: 'auto' },
}));
