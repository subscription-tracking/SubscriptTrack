"""Ölçüm JSON'larından rubrik puanlarını türetir.

Kullanım: python score.py <metrics_klasörü>
Çıktı: <metrics_klasörü>/scores.json
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import rubric as R  # noqa: E402

m = os.path.abspath(sys.argv[1])


def load(name, default=None):
    p = os.path.join(m, name)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else default


def _norm(f):
    f = f.replace(chr(92), '/')
    return 'lib/' + f.split('/mobile/lib/')[-1] if '/mobile/lib/' in f else f


def complexity_summary(data):
    methods = data['methods']
    for x in methods:
        x['file'] = _norm(x['file'])
    total = len(methods)
    cc10 = [x for x in methods if x['cc'] > 10]
    long60 = [x for x in methods if x['lines'] > 60]
    worst = sorted(methods, key=lambda x: -x['cc'])[:10]
    return {
        'methods': total,
        'avg_cc': round(sum(x['cc'] for x in methods) / total, 2),
        'max_cc': worst[0]['cc'],
        'max_cc_method': f"{worst[0]['file']}::{worst[0]['name']}",
        'cc_over_10': len(cc10),
        'cc_over_10_pct': round(100 * len(cc10) / total, 1),
        'lines_over_60': len(long60),
        'lines_over_60_pct': round(100 * len(long60) / total, 1),
        'max_depth': max(x['depth'] for x in methods),
        'top10': [(x['file'], x['name'], x['cc'], x['lines']) for x in worst],
        'longest': [(x['file'], x['name'], x['cc'], x['lines'])
                    for x in sorted(methods, key=lambda x: -x['lines'])[:5]],
    }


def score_side(tag):
    static = load(f'static_{tag}.json')
    cx = complexity_summary(load(f'complexity_{tag}.json'))
    cov = load(f'coverage_{tag}.json')
    ext = load(f'external_{tag}.json', {})
    bench = load('benchmark.json') if tag == 'current' else None

    metrics = {}
    scores = {}

    # statik analiz
    issues = ext.get('analyzer_issues')
    if issues is not None:
        metrics['analyzer_issues'] = issues
        scores['static_analysis'] = R.analyzer_issues(issues)

    # boyut
    sz = static['size']
    metrics.update(max_file_lines=sz['max_lines'], files_over_300_pct=sz['over_300_pct'])
    scores['size'] = R.mean([R.max_file_lines(sz['max_lines']), R.pct_files_over_300(sz['over_300_pct'])])

    # karmaşıklık
    metrics['complexity'] = {k: v for k, v in cx.items() if k not in ('top10', 'longest')}
    scores['complexity'] = R.mean([
        R.pct_methods_cc_over_10(cx['cc_over_10_pct']),
        R.max_method_cc(cx['max_cc']),
        R.pct_methods_over_60_lines(cx['lines_over_60_pct']),
    ])

    # mimari
    ar = static['architecture']
    metrics['architecture'] = {k: ar[k] for k in ('file_import_cycles', 'layer_violations', 'max_fan_out',
                                                   'navigator_push_files', 'feature_layer_cycles',
                                                   'max_fan_out_excl_app', 'max_fan_out_excl_app_file', 'max_fan_out_file')}
    metrics['architecture_score_excl_composition_root'] = R.mean([
        R.import_cycles(ar['file_import_cycles']),
        R.layer_violations(ar['layer_violations']),
        R.max_fan_out(ar['max_fan_out_excl_app']),
    ])
    scores['architecture'] = R.mean([
        R.import_cycles(ar['file_import_cycles']),
        R.layer_violations(ar['layer_violations']),
        R.max_fan_out(ar['max_fan_out']),
    ])

    # tekrar
    d = static['duplication']['duplicated_pct']
    metrics['duplicated_pct'] = d
    scores['duplication'] = R.duplicated_pct(d)

    # test
    if cov:
        overall = cov['corrected']['pct']
        dom = cov['domain_pct'] or 0
        stable = ext.get('tests_stable')
        parts = [(0.5, R.coverage_pct(overall)), (0.3, R.coverage_pct(dom))]
        if stable is not None:
            parts.append((0.2, R.test_stability(stable)))
        wsum = sum(w for w, _ in parts)
        scores['tests'] = round(sum(w * s for w, s in parts) / wsum, 1)
        metrics['coverage'] = {'reported_pct': cov['reported']['pct'], 'corrected_pct': overall,
                               'domain_pct': dom, 'tests_stable': stable,
                               'files_not_in_lcov': cov['files_not_in_lcov']}

    # güvenlik
    sec_parts = []
    secrets = ext.get('secrets_found')
    if secrets is not None:
        sec_parts.append(R.secrets_found(secrets))
        metrics['secrets_found'] = secrets
    adv = ext.get('advisor_proxy')
    if adv is not None:
        sec_parts.append(R.advisor_findings(adv['errors'], adv['warns']))
        metrics['advisor_proxy'] = adv
    out = ext.get('outdated_direct_major')
    if out is not None:
        sec_parts.append(R.outdated_direct_major(out))
        metrics['outdated_direct_major'] = out
    scores['security'] = R.mean(sec_parts)

    # bakım
    mt = static['maintainability']
    metrics['maintainability'] = {k: mt[k] for k in ('doc_ratio_pct', 'tracked_artifacts', 'todo', 'color_literals',
                                                       'turkish_string_literals', 'semantics_calls')}
    scores['maintainability'] = R.mean([R.doc_ratio(mt['doc_ratio_pct']), R.tracked_artifacts(mt['tracked_artifacts'])])

    # performans
    perf = []
    if bench:
        perf += [R.load_ms(bench['controller_load_ms']), R.notify_ms(bench['notify_selectors_ms'])]
        metrics['benchmark'] = {k: bench[k] for k in bench if k != 'scaling'}
    apk = ext.get('apk_mb')
    if apk is not None:
        perf.append(R.apk_mb(apk))
        metrics['apk_mb'] = apk
    scores['performance'] = R.mean(perf) if perf else None

    return {'metrics': metrics, 'category_scores': scores, 'overall': R.overall(scores),
            'complexity_detail': cx}


result = {'current': score_side('current')}
if os.path.exists(os.path.join(m, 'static_baseline.json')):
    result['baseline'] = score_side('baseline')
result['weights'] = R.WEIGHTS
result['labels'] = R.LABELS
json.dump(result, open(os.path.join(m, 'scores.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for tag in ('baseline', 'current'):
    if tag in result:
        print(tag, result[tag]['overall'], result[tag]['category_scores'])
