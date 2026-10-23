import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { SearchField } from '../../../shared/widgets/SearchField';

/**
 * Flutter `SubscriptionListHeader`: arama alanı, yuvarlak ikincil-dolgulu "ekle" ve "filtrele" düğmesi.
 * Dış boşluk 20/16/20/10.
 */
export function SubscriptionListHeader({
  search,
  onSearchChange,
  onAdd,
  onFilter,
  activeFilterCount = 0,
}: {
  search: string;
  onSearchChange: (next: string) => void;
  onAdd: () => void;
  onFilter: () => void;
  activeFilterCount?: number;
}) {
  useThemeRevision();
  return (
    <View style={styles.row}>
      <View style={styles.search}>
        <SearchField value={search} onChangeText={onSearchChange} placeholder="Aboneliklerinde ara" />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abonelik ekle" onPress={onAdd} style={styles.addButton}>
        <MaterialIcons name="add" size={sizes.filterIcon} color={colors.secondary} />
      </Pressable>
      <View style={styles.gap} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={activeFilterCount > 0 ? `Filtrele ve sırala, ${activeFilterCount} etkin filtre` : 'Filtrele ve sırala'}
        onPress={onFilter}
        style={[styles.iconButton, activeFilterCount > 0 && styles.iconButtonActive]}
      >
        <MaterialIcons name="tune" size={sizes.filterIcon} color={activeFilterCount > 0 ? colors.primary : colors.onSurfaceVariant} />
        {activeFilterCount > 0 ? (
          <View style={styles.filterBadge}>
            <Text style={textStyle('captionStrong', { color: colors.onPrimary })}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: gaps.cardInset,
    paddingBottom: spacing.sm - spacing.xxs / 2,
    paddingHorizontal: spacing.lg,
  },
  search: {
    flex: 1,
  },
  addButton: {
    width: sizes.iconButton,
    height: sizes.iconButton,
    marginLeft: spacing.xs,
    borderRadius: sizes.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
  },
  gap: {
    width: spacing.xxs,
  },
  iconButton: {
    width: sizes.iconButton,
    height: sizes.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sizes.iconButton / 2,
  },
  iconButtonActive: {
    backgroundColor: colors.secondaryContainer,
  },
  filterBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: spacing.md,
    height: spacing.md,
    borderRadius: spacing.md / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
}));
