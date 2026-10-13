import { render, screen } from '@testing-library/react-native';

import { LegalDocumentView } from './LegalDocumentView';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));

const document = {
  title: 'Gizlilik politikası',
  version: '1.0',
  lastUpdated: '20 Eylül 2026',
  summary: ['Veri kapsamı kullanıcıya açıklanır.'],
  sections: [{ title: 'Toplanan veriler', body: 'Yalnızca hesap için gereken bilgiler saklanır.' }],
};

describe('LegalDocumentView', () => {
  it('başlığı, sürümü, özet ve bölümleri erişilebilir metin olarak gösterir', () => {
    render(<LegalDocumentView document={document} />);

    expect(screen.getByText('Gizlilik politikası')).toBeTruthy();
    expect(screen.getByText('Belge sürümü 1.0 · Son güncelleme: 20 Eylül 2026')).toBeTruthy();
    expect(screen.getByText('• Veri kapsamı kullanıcıya açıklanır.')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Toplanan veriler' })).toBeTruthy();
    expect(screen.getByText('Yalnızca hesap için gereken bilgiler saklanır.').props.selectable).toBe(true);
  });

  it('yayın öncesi hukuki onay uyarısını gösterir', () => {
    render(<LegalDocumentView document={document} />);
    expect(screen.getByText('Bu metin taslaktır; yayın öncesi hukuki onay gerektirir.')).toBeTruthy();
  });
});
