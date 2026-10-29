import { render, screen } from '@testing-library/react-native';
import { TextField } from './TextField';

it('doğrulama hatasını ve mevcut ipucunu alanın erişilebilir açıklamasında korur', () => {
  const view = render(<TextField label="Tutar" error="Geçerli bir tutar gir." accessibilityHint="Para birimine göre yaz." />);
  expect(screen.getByLabelText('Tutar').props.accessibilityHint).toBe('Hata: Geçerli bir tutar gir. Para birimine göre yaz.');
  expect(screen.getByText('Geçerli bir tutar gir.').props.accessibilityLiveRegion).toBe('polite');
  view.rerender(<TextField label="Tutar" accessibilityHint="Para birimine göre yaz." />);
  expect(screen.getByLabelText('Tutar').props.accessibilityHint).toBe('Para birimine göre yaz.');
});
