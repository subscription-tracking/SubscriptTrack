import { DashboardScreen } from '../../../src/features/dashboard/ui/DashboardScreen';
import { TabScaffold } from '../../../src/features/shell/ui/TabScaffold';

/** Ana sayfa sekmesi (Flutter `DashboardScreen`). */
export default function HomeScreen() {
  return (
    <TabScaffold tab="home">
      <DashboardScreen />
    </TabScaffold>
  );
}
