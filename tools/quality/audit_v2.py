"""Hakkaniyet denetimi (v2 rubriği).

Neden var: v1 rubriği (rubric.py) yalnızca aracın ölçebildiğini puanlıyordu. Bunun
üç zayıflığı vardı: (1) doğrudan optimize ettiğimiz metrikler (dosya boyutu,
karmaşıklık, tekrar) Goodhart etkisine açık, (2) test puanı yalnızca satır
kapsamasına dayanıyordu (assertion kalitesi yok), (3) ölçülmeyen alanlar puana hiç
yansımıyordu (backend davranış testi, cihaz doğrulaması, CI, imzalama).

v2 KURALLARI (mutasyon sonucu görülmeden yazıldı, sonuca göre değiştirilmez):

1. Her metriğin bir KANIT TÜRÜ vardır:
     A = araçla ölçüldü, B = bağımsız ikinci araçla çapraz doğrulandı,
     C = repo/canlı ortam incelemesiyle elle doğrulandı, U = doğrulanmadı.
2. Doğrulanmamış (U) kritik kontrol 5 puan alar (ne 10 ne 0: "bilinmiyor" iyi
   demek değildir ama kötü olduğu da kanıtlanmadı).
3. Yalnızca host makinede ölçülen değerler (performans) en fazla 8 alır.
4. Testler: kapsama tek başına yetmez; kanıt olarak mutasyon testi (çekirdek iş
   mantığına kasıtlı hata sokulup testlerin yakalayıp yakalamadığı) kullanılır.
5. Yayına hazırlık, kod kalitesinden AYRI puanlanır ve genel kod puanına karışmaz.
6. Puanlar eşiklerden mekanik türetilir; elle yukarı/aşağı ayarlanmaz.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import rubric as R  # noqa: E402

M = os.path.abspath(sys.argv[1])


def load(n, d=None):
    p = os.path.join(M, n)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else d


v1 = load('scores.json')['current']
facts = load('audit_facts.json')
mut = load('mutation.json', [])

# ---- v2 ağırlıkları (kod kalitesi) ------------------------------------------
W2 = {'static_analysis': 5, 'size': 8, 'complexity': 12, 'architecture': 15, 'duplication': 5,
      'tests': 25, 'security': 20, 'maintainability': 5, 'performance': 5}
L2 = dict(R.LABELS)
L2['performance'] = 'Performans (yalnızca host ölçümü, tavan 8)'

# ---- test kategorisi v2 -------------------------------------------------------
cov = v1['metrics']['coverage']
valid = [x for x in mut if not x.get('compile_err') and not x.get('equivalent')]
raw_valid = [x for x in mut if not x.get('compile_err')]
raw_killed = sum(1 for x in raw_valid if x['killed'])
killed = sum(1 for x in valid if x['killed'])
mut_pct = round(100 * killed / len(valid), 1) if valid else None
mut_score = R.coverage_pct(mut_pct) if mut_pct is not None else None  # aynı eşik tablosu (85/75/65/55/45)
backend_score = 3 if facts['backend']['edge_function_tests'] == 0 else 8
tparts = [(0.20, R.coverage_pct(cov['corrected_pct'])), (0.15, R.coverage_pct(cov['domain_pct'])),
          (0.05, R.test_stability(cov['tests_stable'])), (0.15, backend_score)]
if mut_score is not None:
    tparts.append((0.35, mut_score))
tests = round(sum(w * s for w, s in tparts) / sum(w for w, _ in tparts), 1)

# ---- güvenlik v2 -----------------------------------------------------------
sec = v1['metrics']['security_scan']
low_open = len(facts['security']['open_low_findings'])
sec_parts = {
    'gizli sızıntı (anon hariç)': R.secrets_found(sec['secrets_non_public']),
    'RLS korumasız tablo': R.rls_unmitigated(len(sec['rls_unmitigated'])),
    'kimliksiz edge function': R.functions_without_auth(len(sec['functions_without_auth'])),
    'hız sınırsız edge function': R.functions_without_rate_limit(len(sec['functions_without_rate_limit'])),
    'canlı advisor (yalnızca aksiyon gerektiren uyarılar)': R.advisor_findings(facts['security']['advisor_errors'], facts['security']['advisor_actionable_warns']),
    'bağımlılık ana sürüm': R.outdated_direct_major(v1['metrics'].get('outdated_direct_major', 0)),
    'açık düşük bulgu (edge function)': R.by_upper(low_open, [(0, 10), (2, 8), (4, 6)]),
    'doğrulanmamış kritik kontrol (RLS davranış testi, cihazda secure-storage/R8)': 5,
}
security = R.mean(sec_parts.values())

perf = min(v1['category_scores']['performance'], 8)

cats = dict(v1['category_scores'])
cats.update(tests=tests, security=security, performance=perf)
overall_v2 = round(sum(cats[k] * W2[k] for k in W2) / sum(W2.values()), 1)

# ---- yayına hazırlık (ayrı) -------------------------------------------------
rel = facts['release']
rel_scores = {
    'Üretim imzası (debug keystore yedeği var, gerçek anahtar yok)': 3,
    'Gerçek cihazda release doğrulaması (bildirim, biyometri, R8, secure-storage geçişi)': 2,
    'iOS build üretildi': 2,
    'CI: hat var; analyze+test+backend yeşil, Android release AAB derlemesi kırmızı': 5,
}
release = R.mean(rel_scores.values())

out = {
    'v1_overall': v1['overall'], 'v2_overall': overall_v2, 'weights_v2': W2, 'labels_v2': L2,
    'v1_categories': v1['category_scores'], 'v2_categories': cats,
    'mutation': {'sample': len(mut), 'compile_errors': len(mut) - len(raw_valid), 'equivalent': len(raw_valid) - len(valid), 'raw_valid': len(raw_valid), 'raw_killed': raw_killed, 'raw_killed_pct': round(100 * raw_killed / len(raw_valid), 1), 'valid': len(valid),
                 'killed': killed, 'killed_pct': mut_pct, 'score': mut_score,
                 'survivors': [x for x in valid if not x['killed']]},
    'tests_parts': {'kapsama': R.coverage_pct(cov['corrected_pct']), 'domain': R.coverage_pct(cov['domain_pct']),
                    'kararlılık': 10, 'backend davranış testi': backend_score, 'mutasyon': mut_score},
    'security_parts': sec_parts,
    'release': {'score': release, 'parts': rel_scores},
    'facts': facts,
}
json.dump(out, open(os.path.join(M, 'scores_v2.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('v1', v1['overall'], '-> v2', overall_v2, '| release', release)
print({k: (v1['category_scores'][k], cats[k]) for k in cats})
print('mutation', mut_pct, 'valid', len(valid), 'of', len(mut))
