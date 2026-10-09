import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { colors, radius, screenGutter, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { CATEGORY_LABELS, SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '../domain/subscription';
import {
  DEFAULT_FILTER,
  SORT_LABELS,
  SORT_OPTIONS,
  type SortOption,
  type SubscriptionFilter,
} from '../domain/subscriptionFilter';

/** "Filtrele ve sırala" sayfası (Flutter `SubscriptionFilterSheet`). Seçimler anında uygulanır. */
export function SubscriptionFilterSheet({
  visible,
  filter,
  currencies,
  onChange,
  onClose,
}: {
  visible: boolean;
  filter: SubscriptionFilter;
  currencies: readonly string[];
  onChange: (next: SubscriptionFilter) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const categoryOptions: ChoiceOption<string>[] = [
    { value: 'all', label: 'Tümü' },
    ...SUBSCRIPTION_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
  ];
  const currencyOptions: ChoiceOption<string>[] = [
    { value: 'all', label: 'Tümü' },
    ...currencies.map((value) => ({ value, label: value })),
  ];
  const sortOptions: ChoiceOption<SortOption>[] = SORT_OPTIONS.map((value) => ({ value, label: SORT_LABELS[value] }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={textStyle('title')}>Filtrele ve sırala</Text>
            <Spacer size={spacing.lg} />

            <Section title="Kategori">
              <ChoiceChips
                options={categoryOptions}
                value={filter.category ?? 'all'}
                onChange={(value) => onChange({ ...filter, category: value === 'all' ? null : (value as SubscriptionCategory) })}
              />
            </Section>
            <Spacer size={spacing.md} />

            {currencies.length > 1 ? (
              <>
                <Section title="Para birimi">
                  <ChoiceChips
                    options={currencyOptions}
                    value={filter.currency ?? 'all'}
                    onChange={(value) => onChange({ ...filter, currency: value === 'all' ? null : value })}
                  />
                </Section>
                <Spacer size={spacing.md} />
              </>
            ) : null}

            <Section title="Sıralama">
              <ChoiceChips options={sortOptions} value={filter.sort} onChange={(sort) => onChange({ ...filter, sort })} />
            </Section>
            <Spacer size={spacing.md} />

            <CheckboxRow checked={filter.dueSoon} onChange={(dueSoon) => onChange({ ...filter, dueSoon })}>
              <Text style={textStyle('bodySmall')}>Önümüzdeki 7 günde yenilenecekler</Text>
            </CheckboxRow>
            <Spacer size={spacing.xl} />

            <OutlinedButton
              label="CSV içe aktar"
              onPress={() => {
                onClose();
                router.push('/subscriptions/import' as Href);
              }}
            />
            <Spacer size={spacing.sm} />
            <OutlinedButton label="Filtreleri temizle" onPress={() => onChange(DEFAULT_FILTER)} />
            <Spacer size={spacing.sm} />
            <PrimaryButton label="Tamam" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{title}</Text>
      <Spacer size={spacing.xs} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: withAlpha(colors.background, 0.7),
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
  },
  content: {
    padding: screenGutter,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.xxs,
  },
});
