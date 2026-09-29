"""lcov.info -> kapsama özeti (toplam, katman, feature).

Hiçbir testin yüklemediği dosyalar lcov'da hiç yer almaz; bu betik onları
tahmini çalıştırılabilir satır sayısıyla %0 kapsamlı ekler ("düzeltilmiş").

Kullanım: python coverage.py <mobile_klasörü> <çıktı.json>
"""
import json
import os
import re
import sys
from collections import defaultdict

mobile = os.path.abspath(sys.argv[1])
out = sys.argv[2]
BS = chr(92)

records = {}
cur = None
for ln in open(os.path.join(mobile, 'coverage', 'lcov.info'), encoding='utf-8'):
    ln = ln.strip()
    if ln.startswith('SF:'):
        cur = ln[3:].replace(BS, '/')
        records[cur] = [0, 0]
    elif ln.startswith('LF:'):
        records[cur][1] = int(ln[3:])
    elif ln.startswith('LH:'):
        records[cur][0] = int(ln[3:])

# lib altındaki tüm dosyalar
all_files = {}
for dp, _, fns in os.walk(os.path.join(mobile, 'lib')):
    for fn in fns:
        if fn.endswith('.dart'):
            p = os.path.join(dp, fn)
            all_files['lib/' + os.path.relpath(p, os.path.join(mobile, 'lib')).replace(BS, '/')] = p


def norm(path):
    path = path.replace(BS, '/')
    i = path.find('lib/')
    return path[i:] if i >= 0 else path


cov = {norm(k): v for k, v in records.items()}


def estimate_executable(path):
    n = 0
    for ln in open(path, encoding='utf-8'):
        t = ln.strip()
        if not t or t.startswith(('//', 'import ', 'export ', 'part ', '@')):
            continue
        if t in ('{', '}', '});', ');', '),', '],', '];'):
            continue
        n += 1
    return n


rows = {}
missing = []
for rel_path, abs_path in all_files.items():
    if rel_path in cov:
        hit, found = cov[rel_path]
        rows[rel_path] = (hit, found, False)
    else:
        rows[rel_path] = (0, estimate_executable(abs_path), True)
        missing.append(rel_path)


def bucket(path):
    m = re.match(r'lib/features/([^/]+)/(domain|data|presentation)/', path)
    if m:
        return 'feature:' + m.group(1), 'layer:' + m.group(2)
    if path.startswith('lib/core/domain/') or path.startswith('lib/core/errors/'):
        return 'core', 'layer:domain'
    if path.startswith('lib/core/'):
        return 'core', 'layer:core-services'
    if path.startswith('lib/shared/'):
        return 'shared', 'layer:presentation'
    if path.startswith('lib/app/'):
        return 'app', 'layer:app'
    return 'other', 'layer:other'


def agg(items):
    hit = sum(h for h, _, _ in items)
    found = sum(f for _, f, _ in items)
    return {'hit': hit, 'found': found, 'pct': round(100 * hit / found, 1) if found else None}


by_feature, by_layer = defaultdict(list), defaultdict(list)
for p, v in rows.items():
    f, l = bucket(p)
    by_feature[f].append(v)
    by_layer[l].append(v)

reported = agg([(h, f, m) for (h, f, m) in rows.values() if not m])
corrected = agg(list(rows.values()))
# domain katmanı: feature domain + core domain/errors
domain_items = by_layer.get('layer:domain', [])
result = {
    'reported': reported,
    'corrected': corrected,
    'files_total': len(rows),
    'files_not_in_lcov': len(missing),
    'files_not_in_lcov_sample': missing[:15],
    'by_layer': {k: agg(v) for k, v in sorted(by_layer.items())},
    'by_feature': {k: agg(v) for k, v in sorted(by_feature.items())},
    'domain_pct': agg(domain_items)['pct'],
    'lowest_files': sorted(
        [(p, round(100 * h / f, 1) if f else 100.0, f) for p, (h, f, _) in rows.items() if f >= 30],
        key=lambda x: x[1])[:12],
}
json.dump(result, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps({'reported': reported['pct'], 'corrected': corrected['pct'], 'domain': result['domain_pct'],
                  'not_in_lcov': len(missing)}))
