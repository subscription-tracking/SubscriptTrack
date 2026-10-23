import { render, screen } from '@testing-library/react-native';

import { OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  it('ağ açık ve bekleyen değişiklik yokken görünmez', () => {
    const { toJSON } = render(<OfflineBanner visible={false} pendingCount={0} />);
    expect(toJSON()).toBeNull();
  });

  it('çevrimdışı durumu ve bekleyen yazım sayısını bildirir', () => {
    render(<OfflineBanner visible pendingCount={2} />);

    const banner = screen.getByLabelText('Çevrimdışı eşitleme durumu');
    expect(banner.props.accessibilityRole).toBe('alert');
    expect(banner.props.accessibilityLiveRegion).toBe('polite');
    expect(screen.getByText('Çevrimdışısın. Son kaydedilen veriler gösteriliyor.')).toBeTruthy();
    expect(screen.getByText('2 değişiklik bağlantı gelince gönderilecek.')).toBeTruthy();
  });

  it('bağlantı varken de bekleyen yazımları gösterir', () => {
    render(<OfflineBanner visible={false} pendingCount={1} />);

    expect(screen.getByText('1 değişiklik bağlantı gelince gönderilecek.')).toBeTruthy();
    expect(screen.queryByText('Çevrimdışısın. Son kaydedilen veriler gösteriliyor.')).toBeNull();
  });
});
