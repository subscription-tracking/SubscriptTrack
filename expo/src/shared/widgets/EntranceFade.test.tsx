import { AccessibilityInfo, Animated, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

import { EntranceFade } from './EntranceFade';

it('hareket azaltma açıkken içeriği animasyon başlatmadan gösterir', async () => {
  const preference = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const timing = jest.spyOn(Animated, 'timing');
  render(<EntranceFade><Text>Giriş başlığı</Text></EntranceFade>);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByText('Giriş başlığı')).toBeTruthy();
  expect(timing).not.toHaveBeenCalled();
  preference.mockRestore();
  timing.mockRestore();
});
