import { useState } from 'react';
import type { ComponentProps } from 'react';

import { FieldIconButton, TextField } from './TextField';

type TextFieldProps = ComponentProps<typeof TextField>;

/**
 * Parola alanı: kilit simgesi ve göster/gizle düğmesi. Flutter `AuthPasswordField`
 * ile aynı davranış. [obscure] ve [onToggleObscure] verilirse üst bileşen durumu
 * paylaşabilir (kayıt ekranında iki alan aynı görünürlüğü kullanır).
 */
export function PasswordField({
  obscure,
  onToggleObscure,
  ...props
}: Omit<TextFieldProps, 'secureTextEntry' | 'suffix' | 'prefixIcon'> & {
  obscure?: boolean;
  onToggleObscure?: (next: boolean) => void;
}) {
  const [ownObscure, setOwnObscure] = useState(true);
  const isObscured = obscure ?? ownObscure;
  const toggle = () => (onToggleObscure ?? setOwnObscure)(!isObscured);

  return (
    <TextField
      {...props}
      prefixIcon="lock-outline"
      secureTextEntry={isObscured}
      suffix={
        <FieldIconButton
          icon={isObscured ? 'visibility' : 'visibility-off'}
          accessibilityLabel={isObscured ? 'Şifreyi göster' : 'Şifreyi gizle'}
          onPress={toggle}
        />
      }
    />
  );
}
