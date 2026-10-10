import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { colors, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { type SubscriptionCategory } from '../domain/subscription';
import { serviceMark } from '../domain/serviceIdentity';

/**
 * Flutter `ServiceIdentity`: marka ikonu (ya da Material yedeği, ya da baş harf) bir tonlu kutuda,
 * ince kenarlık ve yumuşak gölge ile. Boyut `size` ile ölçeklenir; oranlar Flutter ile aynıdır.
 */
export function ServiceIdentity({
  name,
  category,
  size = 44,
}: {
  name: string;
  category: SubscriptionCategory;
  size?: number;
}) {
  const mark = serviceMark(name, category);
  const color = resolveColor(mark, category);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${name} logosu`}
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: size * 0.36,
          backgroundColor: withAlpha(color, 0.16),
          borderColor: withAlpha(color, 0.35),
          shadowColor: color,
          shadowRadius: (size * 0.4) / 2,
        },
      ]}
    >
      {mark.kind === 'brand' ? (
        <FontAwesome6 name={mark.icon} brand size={size * 0.48} color={color} />
      ) : mark.kind === 'material' ? (
        <MaterialIcons name={mark.icon} size={size * 0.52} color={color} />
      ) : (
        <Text style={[textStyle('topBarTitle', { color, fontSize: size * 0.42, letterSpacing: -0.5 })]}>{mark.initial}</Text>
      )}
    </View>
  );
}

/** Hizmetin marka rengi (Flutter `ServiceIdentity.colorFor`): marka, Material yedeği ya da kategori rengi. */
export function resolveServiceColor(name: string, category: SubscriptionCategory): string {
  return resolveColor(serviceMark(name, category), category);
}

function resolveColor(mark: ReturnType<typeof serviceMark>, category: SubscriptionCategory): string {
  if (mark.kind === 'initial') {
    if (mark.color) return mark.color;
    return category === 'software' ? colors.primary : statusColors.mutedText;
  }
  return mark.color;
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
});
