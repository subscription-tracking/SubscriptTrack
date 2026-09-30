"""Benchmark'ı N kez çalıştırır, metrik başına medyanı benchmark.json'a yazar.

Kullanım: python run_benchmark.py <mobile_klasörü> <metrics_klasörü> [tekrar=3]
Tek tek koşular benchmark_run<N>.json olarak saklanır; load/notify dağılımı
spread_* alanlarında verilir. Host makine mikro-benchmark'ıdır (cihaz değil).
"""
import json
import os
import statistics
import subprocess
import sys

mobile, metrics = sys.argv[1], sys.argv[2]
runs = int(sys.argv[3]) if len(sys.argv) > 3 else 3
out = os.path.join(metrics, 'benchmark.json')
results = []
for i in range(1, runs + 1):
    p = subprocess.run(['flutter', 'test', '--no-pub', 'benchmark/controller_benchmark_test.dart'], cwd=mobile,
                       capture_output=True, text=True, encoding='utf-8', shell=True)
    assert p.returncode == 0, p.stdout[-800:]
    d = json.load(open(out, encoding='utf-8'))
    json.dump(d, open(os.path.join(metrics, f'benchmark_run{i}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    results.append(d)
    print(f'run {i}: load={d["controller_load_ms"]} notify={d["notify_selectors_ms"]}', flush=True)

def med(vals):
    return round(statistics.median(vals), 2)

agg = dict(results[0])
for k, v in results[0].items():
    if isinstance(v, (int, float)) and not isinstance(v, bool) and k not in ('subscriptions', 'list_screen_built_tiles'):
        agg[k] = med([r[k] for r in results if k in r])
agg['scaling'] = {
    size: {m: med([r['scaling'][size][m] for r in results]) for m in results[0]['scaling'][size]}
    for size in results[0]['scaling']
}
agg['runs'] = runs
agg['spread_load_ms'] = [r['controller_load_ms'] for r in results]
agg['spread_notify_ms'] = [r['notify_selectors_ms'] for r in results]
agg['note'] = f"Host makine mikro-benchmarkı (cihaz/frame süresi değildir); {runs} koşunun metrik başına medyanı (ms)."
json.dump(agg, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('median: load', agg['controller_load_ms'], 'notify', agg['notify_selectors_ms'])
