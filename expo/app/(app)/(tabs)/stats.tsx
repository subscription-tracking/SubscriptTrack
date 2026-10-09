import { StatsScreen } from '../../../src/features/stats/ui/StatsScreen';
import { TabScaffold } from '../../../src/features/shell/ui/TabScaffold';

/** İstatistik sekmesi: para birimi bazlı toplamlar, ödeme trendi ve kategoriler. */
export default function StatsTabScreen() {
  return (
    <TabScaffold tab="stats">
      <StatsScreen />
    </TabScaffold>
  );
}
