import { Modal, type ModalProps } from 'react-native';
import { useAppLocked } from '../../core/security/lockState';

/**
 * `Modal` ayrı bir pencerede çizilir ve kilit ekranının üstünde kalabilir. Uygulama kilitliyken
 * modalı kapalı tutar; tüm uygulama modalları bunu kullanır.
 */
export function LockAwareModal({ visible, ...rest }: ModalProps) {
  const locked = useAppLocked();
  return <Modal {...rest} visible={Boolean(visible) && !locked} />;
}
