import { useThemeRevision } from '../design/useThemeRevision';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Form içeren ekranların kökü: klavye açılınca alttaki eylem düğmesi klavyenin arkasında kalmaz.
 * iOS'ta `padding`, Android'de sistem yeniden boyutlandırması kullanılır (`AuthScaffold` ile aynı).
 */
export function KeyboardScreen({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  useThemeRevision();
  return (
    <KeyboardAvoidingView style={style} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  );
}
