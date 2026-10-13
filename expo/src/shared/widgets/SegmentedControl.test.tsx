import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedControl } from './SegmentedControl';

jest.mock('../design/useThemeRevision', () => ({ useThemeRevision: () => 0 }));

const options = [
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'yearly', label: 'Yıllık' },
] as const;

describe('SegmentedControl', () => {
  it('seçili dilimi radio olarak işaretler ve değişimi bildirir', () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={options} value="monthly" onChange={onChange} accessibilityLabel="Yenileme sıklığı" />);
    expect(screen.getByLabelText('Yenileme sıklığı').props.accessibilityRole).toBe('radiogroup');
    expect(screen.getByRole('radio', { name: 'Aylık' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('radio', { name: 'Yıllık' }).props.accessibilityState.selected).toBe(false);
    fireEvent.press(screen.getByRole('radio', { name: 'Yıllık' }));
    expect(onChange).toHaveBeenCalledWith('yearly');
  });

  it('pasifken dokunuşu yok sayar', () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={options} value="monthly" onChange={onChange} accessibilityLabel="Sıklık" disabled />);
    fireEvent.press(screen.getByRole('radio', { name: 'Haftalık' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
