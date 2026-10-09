import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textButtonText, textStyle } from '../../../shared/design/typography';
import { CATEGORY_LABELS, SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '../domain/subscription';
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from '../domain/subscriptionFilter';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * "Filtrele ve sırala" alt sayfası (Flutter `SubscriptionFilterSheet`). Tutamaç, kategori çipleri,
 * sıralama radyo listesi ve Arşiv / CSV bağlantıları. Seçimler anında üst ekrana iletilir.
 */
export function SubscriptionFilterSheet({
  visible,
  category,
  sort,
  hasArchived,
  onCategory,
  onSort,
  onOpenArchive,
  onImportCsv,
  onClose,
}: {
  visible: boolean;
  category: SubscriptionCategory | null;
  sort: SortOption;
  hasArchived: boolean;
  onCategory: (next: SubscriptionCategory | null) => void;
  onSort: (next: SortOption) => void;
  onOpenArchive: () => void;
  onImportCsv: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.barrier}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kapat" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={textStyle('title')}>Filtrele ve sırala</Text>
            <View style={styles.gapTitle} />

            <Text style={textStyle('titleSmall')}>Kategori</Text>
            <View style={styles.gapSection} />
            <View style={styles.chips}>
              <FilterChip label="Tümü" selected={category === null} onPress={() => onCategory(null)} />
              {SUBSCRIPTION_CATEGORIES.map((value) => (
                <FilterChip
                  key={value}
                  label={CATEGORY_LABELS[value]}
                  selected={category === value}
                  onPress={() => onCategory(value)}
                />
              ))}
            </View>
            <View style={styles.gapBlock} />

            <Text style={textStyle('titleSmall')}>Sıralama</Text>
            {SORT_OPTIONS.map((option) => (
              <RadioRow key={option} label={SORT_LABELS[option]} selected={sort === option} onPress={() => onSort(option)} />
            ))}
            <View style={styles.gapLinks} />

            <View style={styles.links}>
              {hasArchived ? (
                <LinkButton icon="archive" label="Arşiv" onPress={onOpenArchive} />
              ) : null}
              <View style={styles.linksSpacer} />
              <LinkButton icon="upload-file" label="CSV içe aktar" onPress={onImportCsv} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? withAlpha(colors.primary, 0.15) : colors.surfaceHigh,
          borderColor: selected ? withAlpha(colors.primary, 0.4) : colors.border,
        },
      ]}
    >
      <Text style={selected ? textStyle('filterChipStrong') : textStyle('filterChip')}>{label}</Text>
    </Pressable>
  );
}

function RadioRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={styles.radioRow}>
      <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.onSurfaceVariant }]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={[textStyle('body'), styles.radioLabel]}>{label}</Text>
    </Pressable>
  );
}

function LinkButton({ icon, label, onPress }: { icon: MaterialIconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
      <MaterialIcons name={icon} size={sizes.linkIcon} color={colors.primary} />
      <Text style={[textButtonText, styles.linkLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barrier: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: withAlpha(colors.scrim, 0.54),
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surfaceLow,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: sizes.sheetHandleWidth,
    height: sizes.sheetHandleHeight,
    borderRadius: sizes.sheetHandleHeight / 2,
    backgroundColor: withAlpha(colors.onSurfaceVariant, 0.4),
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  gapTitle: {
    height: gaps.cardInset + spacing.xxs,
  },
  gapSection: {
    height: spacing.sm - spacing.xxs / 2,
  },
  gapBlock: {
    height: gaps.cardInset + spacing.xxs,
  },
  gapLinks: {
    height: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: gaps.pillX,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.pill,
    borderWidth: borderWidth.regular,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget + spacing.xs,
  },
  radioOuter: {
    width: sizes.radioOuter,
    height: sizes.radioOuter,
    borderRadius: sizes.radioOuter / 2,
    borderWidth: borderWidth.focused + 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: sizes.radioInner,
    height: sizes.radioInner,
    borderRadius: sizes.radioInner / 2,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    marginLeft: gaps.rowLoose - 2,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linksSpacer: {
    flex: 1,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.pillHeight,
    paddingHorizontal: gaps.sectionInner,
  },
  linkLabel: {
    marginLeft: spacing.xs,
  },
});
