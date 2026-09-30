"""Test kararlılığı: tam paketi N kez çalıştırır; hepsi geçerse tests_stable=true.

Kullanım: python run_stability.py <mobile_klasörü> <external_current.json> [tekrar=2]
Sonucu ve toplam test sayısını external_current.json'a yazar.
"""
import json
import re
import subprocess
import sys

mobile, ext_path = sys.argv[1], sys.argv[2]
runs = int(sys.argv[3]) if len(sys.argv) > 3 else 2
results, total = [], None
for i in range(runs):
    p = subprocess.run(['flutter', 'test', '--no-pub', '-r', 'compact'], cwd=mobile, capture_output=True,
                       text=True, encoding='utf-8', shell=True)
    text = (p.stdout or '').replace('\r', '\n')
    ok = p.returncode == 0 and 'All tests passed' in text
    counts = re.findall(r'\+(\d+)(?: -(\d+))?:', text)
    if counts:
        total = int(counts[-1][0]) + int(counts[-1][1] or 0)
    results.append(ok)
    print(f'run {i + 1}: {"passed" if ok else "FAILED"}', flush=True)
ext = json.load(open(ext_path, encoding='utf-8'))
ext['tests_stable'] = all(results)
ext['tests_runs'] = results
if total:
    ext['tests_total'] = total
json.dump(ext, open(ext_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('tests_stable =', ext['tests_stable'], 'toplam =', total)
