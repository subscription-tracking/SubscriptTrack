"""Statik ölçümler: boyut, import grafiği, katman ihlalleri, tekrar, bakım.

Kullanım: python measure_static.py <lib_klasörü> <git_klasörü> <çıktı.json>
"""
import hashlib
import json
import os
import re
import statistics
import subprocess
import sys
from collections import defaultdict

lib_root = os.path.abspath(sys.argv[1])
git_root = os.path.abspath(sys.argv[2])
out_path = sys.argv[3]

BS = chr(92)


def rel(path):
    return os.path.relpath(path, os.path.dirname(lib_root)).replace(BS, '/')


files = {}
for dp, _, fns in os.walk(lib_root):
    for fn in fns:
        if fn.endswith('.dart'):
            p = os.path.join(dp, fn)
            files[rel(p)] = open(p, encoding='utf-8').read()

# ---- boyut -----------------------------------------------------------------
lines = {p: s.count('\n') + 1 for p, s in files.items()}
vals = sorted(lines.values())
size = {
    'files': len(files),
    'total_lines': sum(vals),
    'max_lines': vals[-1],
    'max_file': max(lines, key=lines.get),
    'median_lines': statistics.median(vals),
    'p90_lines': vals[int(len(vals) * 0.9) - 1],
    'over_300': sum(1 for v in vals if v > 300),
    'over_400': sum(1 for v in vals if v > 400),
    'over_300_pct': round(100 * sum(1 for v in vals if v > 300) / len(vals), 1),
    'top10': sorted(lines.items(), key=lambda kv: -kv[1])[:10],
}

# ---- import grafiği --------------------------------------------------------
IMPORT = re.compile(r"^(?:import|export)\s+'([^']+)'", re.M)
graph = {p: set() for p in files}
raw_imports = {}
for p, s in files.items():
    raw_imports[p] = IMPORT.findall(s)
    for imp in raw_imports[p]:
        if imp.startswith('dart:'):
            continue
        if imp.startswith('package:subscript_track/'):
            target = 'lib/' + imp[len('package:subscript_track/'):]
        elif imp.startswith('package:'):
            continue
        else:
            target = os.path.normpath(os.path.join(os.path.dirname(p), imp)).replace(BS, '/')
        if target in files:
            graph[p].add(target)

# Tarjan SCC
index_counter = [0]
stack, on_stack, indices, low = [], set(), {}, {}
sccs = []
sys.setrecursionlimit(10000)


def strongconnect(v):
    indices[v] = low[v] = index_counter[0]
    index_counter[0] += 1
    stack.append(v)
    on_stack.add(v)
    for w in graph[v]:
        if w not in indices:
            strongconnect(w)
            low[v] = min(low[v], low[w])
        elif w in on_stack:
            low[v] = min(low[v], indices[w])
    if low[v] == indices[v]:
        comp = []
        while True:
            w = stack.pop()
            on_stack.discard(w)
            comp.append(w)
            if w == v:
                break
        if len(comp) > 1:
            sccs.append(sorted(comp))


for v in graph:
    if v not in indices:
        strongconnect(v)

fan_out = {p: len(t) for p, t in graph.items()}
fan_in = defaultdict(int)
for p, ts in graph.items():
    for t in ts:
        fan_in[t] += 1

# ---- katman ihlalleri ------------------------------------------------------


def layer(path):
    m = re.match(r'lib/features/([^/]+)/(domain|data|presentation)/', path)
    return (m.group(1), m.group(2)) if m else None


violations = []
for p, s in files.items():
    lay = layer(p)
    for imp in raw_imports[p]:
        target = None
        if not imp.startswith(('dart:', 'package:')):
            target = os.path.normpath(os.path.join(os.path.dirname(p), imp)).replace(BS, '/')
        elif imp.startswith('package:subscript_track/'):
            target = 'lib/' + imp[len('package:subscript_track/'):]
        guarded = (lay and lay[1] == 'presentation') or p.startswith('lib/shared/') or p.startswith('lib/app/')
        if guarded and 'supabase_flutter' in imp:
            violations.append((p, imp, 'presentation/shared/app -> supabase_flutter'))
        if (lay and lay[1] == 'domain') or p.startswith('lib/core/domain/'):
            if 'supabase_flutter' in imp or (target and ('/data/' in target or '/presentation/' in target)):
                violations.append((p, imp, 'domain -> data/presentation/supabase'))
        if lay and lay[1] == 'data' and target and '/presentation/' in target:
            violations.append((p, imp, 'data -> presentation'))
        if (p.startswith('lib/core/') or p.startswith('lib/shared/')) and target and re.search(r'features/[^/]+/(data|presentation)/', target):
            violations.append((p, imp, 'core/shared -> feature data/presentation'))
# Navigator.push / MaterialPageRoute (yol tabanlı navigasyon kuralı)
nav_push = [p for p, s in files.items() if 'Navigator.push' in s or 'MaterialPageRoute' in s]

# Katman düzeyinde döngü (feature/katman düğümleri)
node_graph = defaultdict(set)
for p, ts in graph.items():
    a = layer(p)
    for t in ts:
        b = layer(t)
        if a and b and a != b:
            node_graph[a].add(b)
cycles_nodes = []
visiting, done = [], set()


def visit(n):
    if n in done:
        return
    if n in visiting:
        cycles_nodes.append(visiting[visiting.index(n):] + [n])
        return
    visiting.append(n)
    for m in node_graph.get(n, ()):
        visit(m)
    visiting.pop()
    done.add(n)


for n in list(node_graph):
    visit(n)

architecture = {
    'file_import_cycles': len(sccs),
    'file_import_cycle_files': sum(len(c) for c in sccs),
    'cycles_detail': sccs[:10],
    'feature_layer_cycles': len(cycles_nodes),
    'layer_violations': len(violations),
    'layer_violations_detail': [list(v) for v in violations[:20]],
    'navigator_push_files': len(nav_push),
    'max_fan_out': max(fan_out.values()),
    'max_fan_out_excl_app': max((v for k, v in fan_out.items() if not k.startswith('lib/app/') and k != 'lib/main.dart'), default=0),
    'max_fan_out_excl_app_file': max((k for k in fan_out if not k.startswith('lib/app/') and k != 'lib/main.dart'), key=fan_out.get),
    'max_fan_out_file': max(fan_out, key=fan_out.get),
    'max_fan_in': max(fan_in.values()) if fan_in else 0,
    'max_fan_in_file': max(fan_in, key=fan_in.get) if fan_in else None,
    'top_fan_out': sorted(fan_out.items(), key=lambda kv: -kv[1])[:5],
    'top_fan_in': sorted(fan_in.items(), key=lambda kv: -kv[1])[:5],
}

# ---- tekrar (6 satırlık pencere) -------------------------------------------
WINDOW = 6
norm_lines = {}
for p, s in files.items():
    kept = []
    for i, ln in enumerate(s.split('\n')):
        t = ln.strip()
        if not t or t.startswith(('import ', 'export ', '//', '///', 'part ')):
            continue
        if len(t) < 12 or t in ('});', '),', '],', '};'):
            continue
        kept.append((i, t))
    norm_lines[p] = kept
occ = defaultdict(list)
for p, kept in norm_lines.items():
    for k in range(len(kept) - WINDOW + 1):
        h = hashlib.md5('\n'.join(t for _, t in kept[k:k + WINDOW]).encode()).hexdigest()
        occ[h].append((p, k))
dup = defaultdict(set)
for h, places in occ.items():
    if len(places) > 1:
        for p, k in places:
            for j in range(k, k + WINDOW):
                dup[p].add(j)
dup_lines = sum(len(v) for v in dup.values())
total_norm = sum(len(v) for v in norm_lines.values())
duplication = {
    'window': WINDOW,
    'significant_lines': total_norm,
    'duplicated_lines': dup_lines,
    'duplicated_pct': round(100 * dup_lines / total_norm, 1) if total_norm else 0,
    'top_files': sorted(((p, len(v)) for p, v in dup.items()), key=lambda kv: -kv[1])[:8],
}

# ---- bakım -----------------------------------------------------------------
CLASS = re.compile(r'^(?:(?:abstract|final|sealed|base|interface|mixin)\s+)*(?:class|enum|mixin|extension type)\s+([A-Za-z]\w*)', re.M)
public_total = public_doc = 0
for p, s in files.items():
    ls = s.split('\n')
    for i, ln in enumerate(ls):
        m = CLASS.match(ln)
        if m:
            public_total += 1
            j = i - 1
            while j >= 0 and (ls[j].strip().startswith('@') or not ls[j].strip()):
                j -= 1
            if j >= 0 and ls[j].strip().startswith('///'):
                public_doc += 1
todo = sum(len(re.findall(r'\b(?:TODO|FIXME|HACK)\b', s)) for s in files.values())
color_lits = sum(len(re.findall(r'Color\(0x', s)) for s in files.values())
turkish_str = sum(len(re.findall(r"'[^'\n]*[çğıöşüÇĞİÖŞÜ][^'\n]*'", s)) for s in files.values())
semantics = sum(s.count('Semantics(') for s in files.values())
try:
    tracked = subprocess.run(['git', '-C', git_root, 'ls-files'], capture_output=True, text=True, encoding='utf-8').stdout.split('\n')
except Exception:
    tracked = []
artifact_re = re.compile(r'(^|/)(\.gradle/|outputs/|node_modules/)|\.(apk|log)$|(^|/)screen[^/]*\.png$')
artifacts = [t for t in tracked if artifact_re.search(t)]
maintain = {
    'public_types': public_total,
    'documented_types': public_doc,
    'doc_ratio_pct': round(100 * public_doc / public_total, 1) if public_total else 0,
    'todo': todo,
    'color_literals': color_lits,
    'turkish_string_literals': turkish_str,
    'semantics_calls': semantics,
    'tracked_artifacts': len(artifacts),
    'tracked_artifacts_sample': artifacts[:5],
}

json.dump({'size': size, 'architecture': architecture, 'duplication': duplication, 'maintainability': maintain},
          open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps({'files': size['files'], 'lines': size['total_lines'], 'max': size['max_lines'],
                  'cycles': architecture['file_import_cycles'], 'viol': architecture['layer_violations'],
                  'dup%': duplication['duplicated_pct'], 'doc%': maintain['doc_ratio_pct']}, ensure_ascii=False))
