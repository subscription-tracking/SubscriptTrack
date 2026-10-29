import { render, screen } from '@testing-library/react-native';
import { Money } from '../../../../core/domain/money';
import { HeroSpendingCard } from './HeroSpendingCard';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

it('tahminleri ve kayıtlı ödemelerin dönemler arası farkını ayrı açıklar', () => {
  render(<HeroSpendingCard monthly={Money.parse('30')} yearly={Money.parse('360')} currency="TRY" activeCount={1} trend={[1000, 1500]} hasPaymentHistory />);
  expect(screen.getByText('TAHMİNİ AYLIK ABONELİK GİDERİ')).toBeTruthy();
  expect(screen.getByText('Tahmini yıllık ₺360,00')).toBeTruthy();
  expect(screen.getByText('Kayıtlı ödemeler geçen aya göre ₺5,00 arttı')).toBeTruthy();
});
