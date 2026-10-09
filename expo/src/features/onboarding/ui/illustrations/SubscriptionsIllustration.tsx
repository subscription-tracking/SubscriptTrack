import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {  } from '../../../../shared/design/tokens';
import { onboardingColors } from '../../../../shared/design/palette';
import { GlowOrb } from '../../../../shared/widgets/GlowOrb';
import { ServiceIdentity } from '../../../subscriptions/ui/ServiceIdentity';
import { Bob } from '../OnboardingMotion';

/** Flutter `SubscriptionsIllustration`: cüzdan halosu ve dört sallanan hizmet rozeti. 220 × 220 kutu. */
export function SubscriptionsIllustration() {
  return (
    <View style={styles.box}>
      <View style={styles.center}>
        <GlowOrb icon="account-balance-wallet" color={onboardingColors.indigo} size={118} />
      </View>
      <Badge style={{ top: 4, left: 10 }} phase={0}>
        <ServiceIdentity name="Netflix" category="streaming" size={46} />
      </Badge>
      <Badge style={{ top: 10, right: 0 }} phase={1.4}>
        <ServiceIdentity name="Spotify" category="music" size={44} />
      </Badge>
      <Badge style={{ bottom: 14, left: 0 }} phase={2.6}>
        <ServiceIdentity name="iCloud" category="cloud" size={42} />
      </Badge>
      <Badge style={{ bottom: 0, right: 16 }} phase={4.0}>
        <ServiceIdentity name="Disney+" category="streaming" size={40} />
      </Badge>
    </View>
  );
}

function Badge({ style, phase, children }: { style: { top?: number; bottom?: number; left?: number; right?: number }; phase: number; children: ReactNode }) {
  return (
    <View style={[styles.badge, style]}>
      <Bob phase={phase}>{children}</Bob>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 220,
    height: 220,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
  },
});
