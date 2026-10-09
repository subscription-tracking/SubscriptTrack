import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
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
}: {
  search: string;
  onSearchChange: (next: string) => void;
  onAdd: () => void;
  onFilter: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.search}>
        <SearchField value={search} onChangeText={onSearchChange} placeholder="Aboneliklerinde ara" />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abonelik ekle" onPress={onAdd} style={styles.addButton}>
        <MaterialIcons name="add" size={sizes.filterIcon} color={colors.secondary} />
      </Pressable>
      <View style={styles.gap} />
      <Pressable accessibilityRole="button" accessibilityLabel="Filtrele ve sırala" onPress={onFilter} style={styles.iconButton}>
        <MaterialIcons name="tune" size={sizes.filterIcon} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
});
