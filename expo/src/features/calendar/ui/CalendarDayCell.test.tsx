import { StyleSheet, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { civilDate } from '../../../core/time/calendar';
import { CalendarDayCell } from './CalendarDayCell';

const base = {
  day: 5,
  date: civilDate(2026, 10, 5),
  inMonth: true,
  isToday: false,
  isSelected: false,
  hasRenewal: false,
  hasTrial: false,
  isUrgent: false,
  onPress: jest.fn(),
};

describe('CalendarDayCell accessibility', () => {
  it('tam tarihi ve yenileme olayını duyurur', () => {
    const { UNSAFE_getAllByType } = render(<CalendarDayCell {...base} hasRenewal />);

    expect(screen.getByRole('button', { name: '5 Ekim 2026, yenileme var' })).toBeTruthy();
    const cell = UNSAFE_getAllByType(View).find((view) => view.props.accessibilityRole === 'button');
    expect(StyleSheet.flatten(cell?.props.style)?.height).toBeGreaterThanOrEqual(48);
  });

  it('deneme bitişini yenilemeden ayrı duyurur', () => {
    const { UNSAFE_getAllByType } = render(<CalendarDayCell {...base} isToday hasTrial />);

    expect(screen.getByRole('button', { name: '5 Ekim 2026, bugün, deneme bitişi var' })).toBeTruthy();
    expect(UNSAFE_getAllByType(View).some((view) => StyleSheet.flatten(view.props.style)?.backgroundColor === '#9B9BD8')).toBe(true);
  });

  it('aynı günde yenileme ve deneme varsa iki ayrı görsel işaret üretir', () => {
    const { UNSAFE_getAllByType } = render(<CalendarDayCell {...base} hasRenewal hasTrial />);
    const markerColors = UNSAFE_getAllByType(View).map((view) => StyleSheet.flatten(view.props.style)?.backgroundColor);

    expect(markerColors).toContain('#9B9BD8');
    expect(markerColors).toContain('#8B8CF7');
    expect(screen.getByRole('button', { name: '5 Ekim 2026, yenileme var, deneme bitişi var' })).toBeTruthy();
  });

  it('seçili günde deneme işaretinin yenilemeden farklı rengi korur', () => {
    const { UNSAFE_getAllByType } = render(<CalendarDayCell {...base} hasRenewal hasTrial isSelected />);
    const markerColors = UNSAFE_getAllByType(View).map((view) => StyleSheet.flatten(view.props.style)?.backgroundColor);

    expect(markerColors).toContain('#171824');
    expect(markerColors).toContain('#9B9BD8');
  });

  it('seçili durumu bildirir ve içinde bulunulan ay dışındaki hücreleri erişilebilirlikten çıkarır', () => {
    const selected = render(<CalendarDayCell {...base} isSelected />);
    expect(screen.getByRole('button', { name: '5 Ekim 2026' }).props.accessibilityState.selected).toBe(true);
    selected.unmount();

    const { UNSAFE_getAllByType } = render(<CalendarDayCell {...base} inMonth={false} />);
    const outOfMonth = UNSAFE_getAllByType(View).find((view) => view.props.accessibilityRole === 'button');
    expect(outOfMonth).toBeTruthy();
    if (!outOfMonth) throw new Error('Takvim günü hücresi bulunamadı');
    expect(outOfMonth.props.accessibilityState.disabled).toBe(true);
    expect(outOfMonth.props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
