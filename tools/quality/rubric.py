"""Kalite puanlama rubriği.

ÖLÇÜMDEN ÖNCE yazılmıştır ve sonuçlara göre değiştirilmemelidir. Her metrik,
ölçülen bir sayıyı 0-10 arası bir puana çevirir. Kategori puanı metriklerin
ortalaması, genel puan kategori ağırlıklarının ortalamasıdır. Ölçülemeyen
metrik puanlanmaz (`None`) ve kategori ortalamasına katılmaz.
"""

# (kategori, ağırlık) — toplam 100
WEIGHTS = {
    'static_analysis': 5,
    'size': 15,
    'complexity': 15,
    'architecture': 20,
    'duplication': 5,
    'tests': 20,
    'security': 10,
    'maintainability': 5,
    'performance': 5,
}

LABELS = {
    'static_analysis': 'Statik analiz',
    'size': 'Dosya boyutu / God-file',
    'complexity': 'Metot karmaşıklığı',
    'architecture': 'Mimari / bağımlılık',
    'duplication': 'Kod tekrarı',
    'tests': 'Test ve kapsama',
    'security': 'Güvenlik',
    'maintainability': 'Bakım / hijyen',
    'performance': 'Performans (host mikro-ölçüm)',
}


def by_upper(value, table):
    """`table`: [(üst_sınır, puan), ...] artan sırada; ilk `value <= sınır` puanı."""
    for limit, score in table:
        if value <= limit:
            return score
    return table[-1][1] if False else 2


def by_lower(value, table):
    """`table`: [(alt_sınır, puan), ...] azalan sırada; ilk `value >= sınır` puanı."""
    for limit, score in table:
        if value >= limit:
            return score
    return 2


# ---- metrik puanlayıcıları -------------------------------------------------

def analyzer_issues(n):
    return by_upper(n, [(0, 10), (5, 8), (20, 6), (50, 4)])


def max_file_lines(n):
    return by_upper(n, [(300, 10), (400, 8), (600, 6), (900, 4)])


def pct_files_over_300(pct):
    return by_upper(pct, [(2, 10), (5, 8), (10, 6), (20, 4)])


def pct_methods_cc_over_10(pct):
    return by_upper(pct, [(0, 10), (1, 8), (3, 6), (6, 4)])


def max_method_cc(n):
    return by_upper(n, [(10, 10), (15, 8), (25, 6), (40, 4)])


def pct_methods_over_60_lines(pct):
    return by_upper(pct, [(0, 10), (1, 8), (3, 6), (6, 4)])


def import_cycles(n_components):
    return by_upper(n_components, [(0, 10), (1, 7), (3, 5), (6, 3)])


def layer_violations(n):
    return by_upper(n, [(0, 10), (3, 7), (10, 4)])


def max_fan_out(n):
    return by_upper(n, [(15, 10), (25, 8), (35, 6)])


def duplicated_pct(pct):
    return by_upper(pct, [(3, 10), (5, 8), (8, 6), (12, 4)])


def coverage_pct(pct):
    return by_lower(pct, [(85, 10), (75, 9), (65, 8), (55, 6), (45, 4)])


def test_stability(all_passed_both_runs):
    return 10 if all_passed_both_runs else 3


def secrets_found(n):
    return 10 if n == 0 else 2


def advisor_findings(errors, warns):
    if errors > 0:
        return 3
    return by_upper(warns, [(0, 10), (3, 8), (10, 6)])


def outdated_direct_major(n):
    return by_upper(n, [(0, 10), (2, 8), (5, 6)])


def doc_ratio(pct):
    return by_lower(pct, [(50, 10), (35, 8), (20, 6), (10, 4)])


def tracked_artifacts(n):
    return 10 if n == 0 else 4


def load_ms(ms):
    return by_upper(ms, [(50, 10), (150, 8), (400, 6)])


def notify_ms(ms):
    return by_upper(ms, [(5, 10), (20, 8), (60, 6)])


def apk_mb(mb):
    return by_upper(mb, [(20, 10), (35, 8), (60, 6)])


def mean(values):
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 1) if vals else None


def overall(category_scores):
    total = 0.0
    weight = 0.0
    for cat, w in WEIGHTS.items():
        s = category_scores.get(cat)
        if s is None:
            continue
        total += s * w
        weight += w
    return round(total / weight, 1) if weight else None
