import { fireEvent, render, screen } from '@testing-library/react-native';

import { BottomNavigation, type NavItem } from './BottomNavigation';
import { sizes } from '../design/tokens';

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 12 }) }));

const items: NavItem[] = [
  { key: 'home', label: 'Ana sayfa', icon: 'home', iconOutline: 'home-outline' },
  { key: 'subscriptions', label: 'Abonelikler', icon: 'grid', iconOutline: 'grid-outline' },
];

describe('BottomNavigation accessibility', () => {
  it('exposes a tab list, selected tab state, and usable tab actions', () => {
    const onChange = jest.fn();
    render(<BottomNavigation items={items} activeIndex={0} onChange={onChange} />);

    expect(screen.getByLabelText('Ana gezinme').props.accessibilityRole).toBe('tablist');
    expect(screen.getByRole('tab', { name: 'Ana sayfa' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Abonelikler' }).props.accessibilityState.selected).toBe(false);

    fireEvent.press(screen.getByRole('tab', { name: 'Abonelikler' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('preserves the safe area while keeping every tab at least the minimum touch height', () => {
    render(<BottomNavigation items={items} activeIndex={0} onChange={jest.fn()} />);
    const bar = screen.getByLabelText('Ana gezinme');
    const tabs = [screen.getByRole('tab', { name: 'Ana sayfa' }), screen.getByRole('tab', { name: 'Abonelikler' })];

    expect(bar.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ paddingBottom: 12 })]));
    for (const tab of tabs) {
      expect(tab.props.style.minHeight).toBeGreaterThanOrEqual(sizes.minTouchTarget);
    }
  });

  it('keeps system font scaling enabled with a readable label floor', () => {
    const { getByText } = render(<BottomNavigation items={items} activeIndex={0} onChange={jest.fn()} />);
    const label = getByText('Ana sayfa');
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.minimumFontScale).toBe(0.85);
    expect(label.props.allowFontScaling).not.toBe(false);
    expect(screen.getByRole('tab', { name: 'Ana sayfa' }).props.accessibilityLabel).toBe('Ana sayfa');
  });
});
