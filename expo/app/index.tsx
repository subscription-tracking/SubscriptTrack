import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../src/shared/design/tokens';

/** Geçici karşılama ekranı. Oturum yönlendirmesi Aşama 1'de eklenecek. */
export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SubscriptTrack</Text>
      <Text style={styles.subtitle}>Aboneliklerini tek yerden takip et.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    color: colors.onBackground,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 15,
  },
});
