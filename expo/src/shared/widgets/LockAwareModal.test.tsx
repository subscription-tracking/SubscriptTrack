import { act, render } from '@testing-library/react-native';
import { Modal, Text } from 'react-native';

import { setAppLocked } from '../../core/security/lockState';
import { LockAwareModal } from './LockAwareModal';

afterEach(() => act(() => setAppLocked(false)));

it('kilitli değilken visible değerini korur', () => {
  const view = render(<LockAwareModal visible><Text>içerik</Text></LockAwareModal>);
  expect(view.UNSAFE_getByType(Modal).props.visible).toBe(true);
});

it('kilitliyken visible=false olur ve kilit açılınca geri döner', () => {
  const view = render(<LockAwareModal visible><Text>içerik</Text></LockAwareModal>);
  act(() => setAppLocked(true));
  expect(view.UNSAFE_getByType(Modal).props.visible).toBe(false);
  act(() => setAppLocked(false));
  expect(view.UNSAFE_getByType(Modal).props.visible).toBe(true);
});
