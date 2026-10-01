"""Statik güvenlik taraması: migration RLS durumu, edge function kimlik/hız sınırı, gitleaks.

Kullanım: python scan_security.py <repo_kökü> <metrics_klasörü>
Çıktı:  <metrics>/security_current.json  (canlı veritabanı DEĞİL, kaynak taramasıdır)
"""
import base64
import glob
import json
import os
import re
import subprocess
import sys

root, metrics = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
mig = sorted(glob.glob(os.path.join(root, 'backend', 'migrations', '*.sql')))
sql = '\n'.join(open(p, encoding='utf-8').read() for p in mig)
sql_nc = re.sub(r'--[^\n]*', '', sql)

tables = set(re.findall(r'CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)', sql_nc, re.I)) - {'IF'}
rls = set(re.findall(r'ALTER TABLE\s+(?:public\.)?(\w+)\s+ENABLE ROW LEVEL SECURITY', sql_nc, re.I))
policies = set(re.findall(r'CREATE POLICY\s+(?:"[^"]*"|\S+)\s+ON\s+(?:public\.)?(\w+)', sql_nc, re.I))
# Ortak katalog tablosu: RLS yok ama yazma yetkisi açıkça geri alınmış olmalı.
readonly = set(re.findall(r'REVOKE\s+INSERT,\s*UPDATE,\s*DELETE\s+ON\s+(?:public\.)?(\w+)', sql_nc, re.I))

rls_missing = sorted(t for t in tables if t not in rls)
rls_unmitigated = sorted(t for t in rls_missing if t not in readonly)
rls_no_policy = sorted(t for t in tables if t in rls and t not in policies)

fdir = os.path.join(root, 'backend', 'supabase', 'functions')
funcs = sorted(d for d in os.listdir(fdir) if os.path.isfile(os.path.join(fdir, d, 'index.ts')))
no_auth, no_rate = [], []
for f in funcs:
    src = open(os.path.join(fdir, f, 'index.ts'), encoding='utf-8').read()
    if not re.search(r'getUser|auth\.getClaims|verifyJwt', src):
        no_auth.append(f)
    if not re.search(r'rate.?limit|429|too many', src, re.I):
        no_rate.append(f)

# Git geçmişindeki gitleaks bulguları: anon (herkese açık) anahtar ayrıştırılır.
def jwt_role(commit, path):
    try:
        text = subprocess.run(['git', '-C', root, 'show', f'{commit}:{path}'], capture_output=True, text=True,
                              encoding='utf-8').stdout
        m = re.search(r'eyJ[\w-]+\.(eyJ[\w-]+)\.', text)
        p = m.group(1) + '=' * (-len(m.group(1)) % 4)
        return json.loads(base64.urlsafe_b64decode(p)).get('role')
    except Exception:
        return None

secrets_total, secrets_public, secrets_private = 0, 0, 0
for name in ('gitleaks_history.json', 'gitleaks_lib.json', 'gitleaks_backend.json'):
    p = os.path.join(metrics, name)
    if not os.path.exists(p):
        continue
    findings = json.load(open(p, encoding='utf-8'))
    # Kişisel veri (yazar adı/e-posta) depoya girmesin (güvenlik denetimi F-21).
    if any('Author' in f or 'Email' in f for f in findings):
        for f in findings:
            f.pop('Author', None)
            f.pop('Email', None)
        json.dump(findings, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    for f in findings:
        secrets_total += 1
        role = jwt_role(f['Commit'], f['File']) if f.get('RuleID') == 'jwt' and f.get('Commit') else None
        if role == 'anon':
            secrets_public += 1
        else:
            secrets_private += 1

out = {
    'tables': len(tables), 'rls_missing': rls_missing, 'rls_missing_readonly_catalog': sorted(set(rls_missing) & readonly),
    'rls_unmitigated': rls_unmitigated, 'rls_no_policy': rls_no_policy,
    'functions': funcs, 'functions_without_auth': no_auth, 'functions_without_rate_limit': no_rate,
    'secrets_total': secrets_total, 'secrets_public_anon': secrets_public, 'secrets_non_public': secrets_private,
    'note': 'Kaynak taraması; canlı veritabanı/edge ortamı doğrulanmadı.',
}
json.dump(out, open(os.path.join(metrics, 'security_current.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in out.items() if k != 'note'}, ensure_ascii=False))
