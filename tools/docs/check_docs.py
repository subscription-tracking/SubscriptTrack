"""Doküman tutarlılık kontrolü.

Kullanım:  python tools/docs/check_docs.py   (depo kökünden; hata varsa çıkış kodu 1)

Kontroller (docs/archive ve docs/quality hariç, kök README dahil):
  1. Göreli Markdown bağlantıları git'te izlenen var olan dosyaya (ve başlığa) gider.
  2. Belgelerde elle yazılmış Flutter/Dart sürüm numarası yok (tek kaynak: pubspec.lock / CI).
  3. Belgelerde elle yazılmış test sayısı yok (tek kaynak: docs/quality).
  4. Anılan migration numaraları backend/migrations içinde var.
  5. `outputs/` (git dışı) ve eski `SubscriptTrack-Documentation` yoluna atıf yok.
"""
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)

tracked = set(subprocess.run(['git', 'ls-files'], capture_output=True, text=True, encoding='utf-8').stdout.split('\n'))
tracked_dirs = {os.path.dirname(p) for p in tracked}
for p in list(tracked):
    d = os.path.dirname(p)
    while d:
        tracked_dirs.add(d)
        d = os.path.dirname(d)

EXCLUDE = ('docs/archive/', 'docs/quality/')
files = [p for p in sorted(tracked) if p.endswith('.md') and (p == 'README.md' or p.startswith('docs/')) and not p.startswith(EXCLUDE)]

errors = []


def slug(heading):
    h = heading.strip().lower()
    h = re.sub(r'[`*_~]', '', h)
    h = re.sub(r'[^\w\- ]', '', h, flags=re.UNICODE)
    return h.replace(' ', '-')


def headings(path):
    out = set()
    fence = False
    for line in open(path, encoding='utf-8'):
        if line.startswith('```'):
            fence = not fence
        if not fence and line.startswith('#'):
            out.add(slug(line.lstrip('#')))
    return out


migrations = {f.split('_')[0] for f in os.listdir('backend/migrations') if f.endswith('.sql')}
link_re = re.compile(r'(?<!\!)\[[^\]]*\]\(([^)\s]+)\)')

for f in files:
    text = open(f, encoding='utf-8').read()
    body = re.sub(r'```.*?```', '', text, flags=re.S)  # kod bloklarındaki örnekleri atla
    for target in link_re.findall(body):
        if re.match(r'^(https?:|mailto:|#|subscripttrack:)', target):
            if target.startswith('#') and slug(target[1:]) not in headings(f) and target[1:] not in headings(f):
                errors.append(f'{f}: bağlantı başlığı yok -> {target}')
            continue
        path, _, anchor = target.partition('#')
        full = os.path.normpath(os.path.join(os.path.dirname(f), path)).replace(chr(92), '/')
        is_dir = full in tracked_dirs
        if full not in tracked and not is_dir:
            errors.append(f'{f}: bağlantı hedefi yok/izlenmiyor -> {target}')
            continue
        if anchor and full.endswith('.md') and full in tracked:
            if anchor not in headings(full):
                errors.append(f'{f}: hedefte başlık yok -> {target}')
    if re.search(r'\b(Flutter|Dart)\s+\d+\.\d+(\.\d+)?', body):
        errors.append(f'{f}: elle yazılmış Flutter/Dart sürüm numarası (pubspec.lock/CI tek kaynaktır)')
    for m in re.finditer(r'\b\d{2,4}\s*(?:/\s*\d{2,4}\s*)?test\b', body, flags=re.I):
        errors.append(f'{f}: elle yazılmış test sayısı "{m.group(0)}" (docs/quality tek kaynaktır)')
    for m in re.finditer(r'\bmigration\s+(\d{3})\b|\b(\d{3})_[a-z0-9_]+\.sql', body, flags=re.I):
        num = m.group(1) or m.group(2)
        if num not in migrations:
            errors.append(f'{f}: var olmayan migration numarası {num}')
    if 'outputs/' in body:
        errors.append(f'{f}: git dışı outputs/ klasörüne atıf')
    if 'SubscriptTrack-Documentation' in body:
        errors.append(f'{f}: eski SubscriptTrack-Documentation yoluna atıf')

if errors:
    print(f'{len(errors)} sorun:')
    for e in errors:
        print(' -', e)
    sys.exit(1)
print(f'doküman kontrolü temiz ({len(files)} dosya)')
