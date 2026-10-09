import { SettingsHome } from '../../../../src/features/settings/ui/SettingsHome';
import { TabScaffold } from '../../../../src/features/shell/ui/TabScaffold';

/** Ayarlar sekmesi (Flutter `ProfileTab`): hesap, tercihler, uygulama, veri ve gizlilik, destek. */
export default function SettingsScreen() {
  return (
    <TabScaffold tab="settings">
      <SettingsHome />
    </TabScaffold>
  );
}
