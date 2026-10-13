import { fireEvent, render, screen } from '@testing-library/react-native';

import { GroupedList, ListRow } from './GroupedList';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

describe('GroupedList', () => {
  it('satırları etiket ve değerle gösterir', () => {
    render(
      <GroupedList>
        <ListRow label="Sıklık" value="Aylık" />
        <ListRow label="Hatırlatma" value="3 gün önce" />
      </GroupedList>,
    );
    expect(screen.getByLabelText('Sıklık: Aylık')).toBeTruthy();
    expect(screen.getByText('3 gün önce')).toBeTruthy();
  });

  it('yalnızca onPress verilen satır dokunulabilir', () => {
    const onPress = jest.fn();
    render(
      <GroupedList>
        <ListRow label="Sıklık" value="Aylık" />
        <ListRow label="Ödeme yöntemi" value="Belirtilmedi" onPress={onPress} />
      </GroupedList>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.press(screen.getByRole('button', { name: 'Ödeme yöntemi: Belirtilmedi' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
