"""metrics/*.json -> code-review-report/index.html (ölçüm tabanlı rapor).

Kullanım: python build_report.py <code-review-report klasörü>
"""
import html
import json
import os
import sys

root = os.path.abspath(sys.argv[1])
M = os.path.join(root, 'metrics')


def load(name, default=None):
    p = os.path.join(M, name)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else default


S = load('scores.json')
cur, base = S['current'], S.get('baseline')
static_c, static_b = load('static_current.json'), load('static_baseline.json')
cov_c, cov_b = load('coverage_current.json'), load('coverage_baseline.json')
bench = load('benchmark.json')
outdated = load('pub_outdated.json')
rls = load('migrations_rls.json')
secs = load('security_current.json', {})
ext_c = load('external_current.json', {})
labels, weights = S['labels'], S['weights']
e = html.escape


def sc(v):
    return '—' if v is None else f'{v:.1f}'


def cls(v):
    if v is None:
        return 'na'
    return 'good' if v >= 8 else 'mid' if v >= 6 else 'bad'


def fmt(v):
    if isinstance(v, float):
        return f'{v:g}'
    return e(str(v))


def table(head, rows, right=()):
    h = ''.join(f'<th{" class=r" if i in right else ""}>{e(x)}</th>' for i, x in enumerate(head))
    b = ''
    for r in rows:
        b += '<tr>' + ''.join(
            f'<td{" class=r" if i in right else ""}>{c if isinstance(c, str) and c.startswith("<") else fmt(c)}</td>'
            for i, c in enumerate(r)) + '</tr>'
    return f'<table><tr>{h}</tr>{b}</table>'


def short(path):
    return path.replace('lib/features/', '').replace('lib/', '')


# ---- kategori tablosu ------------------------------------------------------
cat_rows = []
for k in weights:
    b = base['category_scores'].get(k) if base else None
    c = cur['category_scores'].get(k)
    delta = '' if b is None or c is None else f'{c - b:+.1f}'
    cat_rows.append([labels[k], f'{weights[k]}%', f'<span class="pill {cls(b)}">{sc(b)}</span>',
                     f'<span class="pill {cls(c)}">{sc(c)}</span>', delta])
cat_html = table(['Kategori', 'Ağırlık', 'HEAD (baseline)', 'Şimdi', 'Fark'], cat_rows, right=(1, 2, 3, 4))

bm, cm = (base['metrics'] if base else {}), cur['metrics']


def mrow(name, bval, cval, score=''):
    return [name, '—' if bval is None else bval, '—' if cval is None else cval, score]


size_rows = [
    mrow('En büyük dosya (satır)', bm.get('max_file_lines'), cm['max_file_lines']),
    mrow('300 satırı aşan dosya %', bm.get('files_over_300_pct'), cm['files_over_300_pct']),
    mrow('Dosya sayısı', static_b['size']['files'] if static_b else None, static_c['size']['files']),
    mrow('Toplam satır', static_b['size']['total_lines'] if static_b else None, static_c['size']['total_lines']),
    mrow('Medyan / p90 dosya (satır)', f"{static_b['size']['median_lines']:g} / {static_b['size']['p90_lines']}" if static_b else None,
         f"{static_c['size']['median_lines']:g} / {static_c['size']['p90_lines']}"),
]
cxb, cxc = (bm.get('complexity') or {}), cm['complexity']
cx_rows = [
    mrow('Metot sayısı', cxb.get('methods'), cxc['methods']),
    mrow('Ortalama döngüsel karmaşıklık', cxb.get('avg_cc'), cxc['avg_cc']),
    mrow('En yüksek karmaşıklık', cxb.get('max_cc'), cxc['max_cc']),
    mrow('CC > 10 olan metot (%)', f"{cxb.get('cc_over_10')} ({cxb.get('cc_over_10_pct')}%)" if cxb else None,
         f"{cxc['cc_over_10']} ({cxc['cc_over_10_pct']}%)"),
    mrow('60 satırı aşan metot (%)', f"{cxb.get('lines_over_60')} ({cxb.get('lines_over_60_pct')}%)" if cxb else None,
         f"{cxc['lines_over_60']} ({cxc['lines_over_60_pct']}%)"),
    mrow('En derin iç içe geçme', cxb.get('max_depth'), cxc['max_depth']),
]
arb, arc = bm.get('architecture') or {}, cm['architecture']
ar_rows = [
    mrow('Dosya düzeyinde import döngüsü', arb.get('file_import_cycles'), arc['file_import_cycles']),
    mrow('Feature/katman döngüsü', arb.get('feature_layer_cycles'), arc['feature_layer_cycles']),
    mrow('Katman kuralı ihlali', arb.get('layer_violations'), arc['layer_violations']),
    mrow('En yüksek fan-out (bir dosyanın import ettiği iç dosya)', arb.get('max_fan_out'), arc['max_fan_out']),
    mrow('Navigator.push kullanan dosya', arb.get('navigator_push_files'), arc['navigator_push_files']),
]
covm = cm.get('coverage', {})
cvb = (bm.get('coverage') or {})
test_rows = [
    mrow('Satır kapsama % (lcov, yalnızca yüklenen dosyalar)', cvb.get('reported_pct'), covm.get('reported_pct')),
    mrow('Satır kapsama % (düzeltilmiş: yüklenmeyen dosyalar %0)', cvb.get('corrected_pct'), covm.get('corrected_pct')),
    mrow('Domain katmanı kapsama %', cvb.get('domain_pct'), covm.get('domain_pct')),
    mrow('lcov\'a hiç girmeyen dosya', cvb.get('files_not_in_lcov'), covm.get('files_not_in_lcov')),
    mrow('Test paketi iki koşuda da geçti', 'hayır (3 dosya yüklenemiyor)' if base and cvb.get('tests_stable') is False else '—',
         'evet' if covm.get('tests_stable') else 'hayır'),
]
mtb, mtc = bm.get('maintainability') or {}, cm['maintainability']
mt_rows = [
    mrow('Dartdoc\'lu public tip %', mtb.get('doc_ratio_pct'), mtc['doc_ratio_pct']),
    mrow('Git\'te izlenen artefakt dosya', mtb.get('tracked_artifacts'), mtc['tracked_artifacts']),
    mrow('Sabit renk (Color(0x…))', mtb.get('color_literals'), mtc['color_literals']),
    mrow('Sabit Türkçe metin', mtb.get('turkish_string_literals'), mtc['turkish_string_literals']),
    mrow('Semantics() çağrısı', mtb.get('semantics_calls'), mtc['semantics_calls']),
    mrow('TODO/FIXME', mtb.get('todo'), mtc['todo']),
]

# ---- güvenlik --------------------------------------------------------------
sec_rows = [
    ['gitleaks (çalışma ağacı: lib + backend)', '0 bulgu', ''],
    ['gitleaks (son 300 commit geçmişi)', f"{secs.get('secrets_total', 1)} bulgu, {secs.get('secrets_non_public', 0)} tanesi gizli",
     'app_environment.dart, Temmuz 2026 commitindeki değer; JWT rolü <code>anon</code> (Supabase publishable anahtar, istemcide zaten açık olması tasarım gereği; ilgili committen çözülüp doğrulandı). Puana girmez, geçmişte kalıcıdır.'],
    ['RLS: korumasız tablo (RLS yok ve yazma yetkisi geri alınmamış)', str(len(secs.get('rls_unmitigated', []))),
     'RLS olmayan ' + ', '.join(secs.get('rls_missing', [])) + ' ortak katalog tablolarıdır; migration 026 anon/authenticated için INSERT/UPDATE/DELETE yetkisini açıkça geri alır. RLS açık ama politikasız (' + ', '.join(secs.get('rls_no_policy', [])) + ') tablolar istemciye kapalıdır (yalnızca service-role); bu bilinçli mi diye doğrulanmadı.'],
    ['Edge function kimlik doğrulaması olmayan', f"{len(secs.get('functions_without_auth', []))} / {len(secs.get('functions', []))}", 'Kaynak taraması: <code>getUser</code> çağrısı.'],
    ['Edge function uygulama düzeyinde hız sınırı olmayan', f"{len(secs.get('functions_without_rate_limit', []))} / {len(secs.get('functions', []))}",
     ', '.join(secs.get('functions_without_rate_limit', [])) + '. Supabase platform sınırları geçerli olabilir ama kodda istek başına/kullanıcı başına sınır yok.'],
    ['Canlı Supabase advisor (2026-09-30, salt okunur)', '0 hata, 5 uyarı', '4 uyarı SECURITY DEFINER RPC: auth.uid() ve sahiplik kontrolleri kaynaktan doğrulandı, tasarım gereği. 1 uyarı Leaked Password Protection kapalı (aksiyon gerekir). Performans advisor: 15 RLS InitPlan uyarısı migration 031 ile sıfıra indi.'],
    ['Doğrudan bağımlılık, ana sürüm geride', f"{outdated['major_behind']} / {outdated['direct']}", 'Danışma (advisory) bulgusu yok; ' + str(outdated['discontinued']) + ' geçişli paket "discontinued".'],
]
dep_rows = [[r[0], r[1], r[2], 'evet' if r[3] else 'hayır'] for r in outdated['rows']]

# ---- performans ------------------------------------------------------------
perf_html = ''
if bench:
    sc_rows = []
    for n_, v in bench.get('scaling', {}).items():
        sc_rows.append([n_, v['load_ms'], v['notify_selectors_ms'], v['projected_renewals_unused_by_ui_ms']])
    perf_rows = [
        ['controller.load() (1000 abonelik)', bench['controller_load_ms'], 'ms'],
        ['Bildirim sonrası selector yeniden hesabı (1000)', bench['notify_selectors_ms'], 'ms'],
        ['StatsViewModel.build (1000 abonelik, 2000 ödeme)', bench['stats_view_model_ms'], 'ms'],
        ['Liste filtre+sırala (1000)', bench['list_filter_sort_ms'], 'ms'],
        ['Takvim gün+ay hesabı (1000)', bench.get('calendar_month_ms', '—'), 'ms'],
        ['ReminderPlanner.plan (1000)', bench['reminder_planner_ms'], 'ms'],
        ['Stats ekranı pump (200 abonelik, test ortamı)', bench['stats_screen_pump_200_ms'], 'ms'],
        ['Liste ekranı pump (1000 abonelik, test ortamı)', bench['list_screen_pump_1000_ms'], 'ms'],
    ]
    perf_html = ('<h3>Mikro-benchmark (host makine, medyan)</h3>' + table(['Ölçüm', 'Değer', 'Birim'], perf_rows, right=(1,)) +
                 '<h3>Ölçek tablosu</h3>' + table(['Abonelik', 'load (ms)', 'selector yeniden hesap (ms)', 'projectedRenewals (ms, UI\'da çağrılmıyor)'], sc_rows, right=(0, 1, 2, 3)))

# ---- kapsama tabloları -----------------------------------------------------
feat_rows = [[k.replace('feature:', ''), v['found'], v['pct']] for k, v in sorted(cov_c['by_feature'].items(), key=lambda kv: (kv[1]['pct'] if kv[1]['pct'] is not None else 101))]
layer_rows = [[k.replace('layer:', ''), v['found'], v['pct']] for k, v in cov_c['by_layer'].items()]
low_rows = [[short(p), pct, n] for p, pct, n in cov_c['lowest_files']]

top_cx = [[short(f), n, c, l] for f, n, c, l in cur['complexity_detail']['top10']]
longest = [[short(f), n, c, l] for f, n, c, l in cur['complexity_detail']['longest']]
top_size = [[short(p), n] for p, n in static_c['size']['top10']]
dup = static_c['duplication']
dup_rows = [[short(p), n] for p, n in dup['top_files']]
fo_rows = [[short(p), n] for p, n in static_c['architecture']['top_fan_out']]
fi_rows = [[short(p), n] for p, n in static_c['architecture']['top_fan_in']]


# ---- v2 hakkaniyet denetimi ------------------------------------------------
A2 = load('scores_v2.json')
audit_html = ''
if A2:
    w2, l2 = A2['weights_v2'], A2['labels_v2']
    ev = {'static_analysis': 'A', 'size': 'A (kendi optimize ettiğimiz: Goodhart riski)', 'complexity': 'A (kendi aracımız + optimize edildi)',
          'architecture': 'A (kendi kurallarımız; kök hariç tutma sonradan eklendi)', 'duplication': 'B (jscpd %' + str(A2['facts']['duplication_cross_check']['duplicated_pct']) + ', bizim araç %' + str(A2['facts']['duplication_cross_check']['own_tool_pct']) + ')',
          'tests': 'A + mutasyon (C)', 'security': 'A + C (canlı dashboard, kaynak incelemesi) + U', 'maintainability': 'A (zayıf: yalnızca dartdoc ve artefakt)',
          'performance': 'A (yalnızca host; cihaz ölçümü yok)'}
    rows2 = []
    for k in w2:
        b, c = A2['v1_categories'].get(k), A2['v2_categories'].get(k)
        d = '' if b is None or c is None else f'{c - b:+.1f}'
        rows2.append([l2[k], f'{w2[k]}%', f'<span class="pill {cls(b)}">{sc(b)}</span>', f'<span class="pill {cls(c)}">{sc(c)}</span>', d, ev[k]])
    cat2 = table(['Kategori', 'v2 ağırlık', 'v1 puan', 'v2 puan', 'Fark', 'Kanıt türü'], rows2, right=(1, 2, 3, 4))
    mu = A2['mutation']
    surv = [[short(x['file']), x['line'], x['orig'], x['mut']] for x in mu['survivors']]
    mut_tbl = table(['Dosya', 'Satır', 'Özgün', 'Mutant (testlerce yakalanmadı)'], surv, right=(1,)) if surv else '<p>Hayatta kalan mutant yok.</p>'
    sp = [[k, f'<span class="pill {cls(v)}">{sc(v)}</span>'] for k, v in A2['security_parts'].items()]
    sec_tbl = table(['Güvenlik alt kalemi (v2)', 'Puan'], sp, right=(1,))
    rp = [[k, f'<span class="pill {cls(v)}">{sc(v)}</span>'] for k, v in A2['release']['parts'].items()]
    rel_tbl = table(['Yayına hazırlık kalemi', 'Puan'], rp, right=(1,))
    tp = [[k, f'<span class="pill {cls(v)}">{sc(v)}</span>'] for k, v in A2['tests_parts'].items()]
    t_tbl = table(['Test alt kalemi (v2)', 'Puan'], tp, right=(1,))
    audit_html = f"""
<h2 id="hakkaniyet">1b. Hakkaniyet denetimi (v2): puanlar şişirilmiş miydi?</h2>
<div class="grid">
<div class="card big"><b>{sc(A2['v1_overall'])}</b><span>v1 genel (yalnızca aracın ölçtüğü)</span></div>
<div class="card big"><b>{sc(A2['v2_overall'])}</b><span>v2 genel — KOD KALİTESİ (ağırlıklar ve kanıt kuralları düzeltilmiş)</span></div>
<div class="card big"><b>{sc(A2['release']['score'])}</b><span>YAYINA HAZIRLIK (ayrı puan)</span></div>
<div class="card big"><b>%{mu['killed_pct']}</b><span>mutasyon skoru ({mu['killed']}/{mu['valid']} mutant yakalandı)</span></div>
</div>
<div class="note"><b>Neden yeniden puanladık:</b> v1 yalnızca aracın ölçebildiğini puanlıyordu. Doğrudan optimize ettiğimiz metrikler (dosya boyutu, karmaşıklık, tekrar) 10 alıyordu; test puanı yalnızca satır kapsamasına dayanıyordu; backend testi, cihaz doğrulaması, CI ve imzalama puana hiç girmiyordu. v2 kuralları mutasyon sonucu görülmeden yazıldı (<code>tools/quality/audit_v2.py</code>) ve sonuca göre değiştirilmedi; tek istisna: kanıtlanmış eşdeğer bir mutantı sonradan hesaptan çıkardım (ham hesap da aynı puanı verir, ikisi de aşağıda).</div>
<h3>Kriterler</h3>
<ol>
<li><b>Kanıt türü:</b> A = araçla ölçüldü, B = bağımsız ikinci araçla çapraz doğrulandı, C = repo/canlı ortam incelemesi, U = doğrulanmadı.</li>
<li><b>Doğrulanmamış kritik kontrol 5 alır</b> (bilinmiyor iyi demek değildir; kötü olduğu da kanıtlanmadı).</li>
<li><b>Yalnızca host makinede ölçülen değer en fazla 8</b> alır (performans).</li>
<li><b>Test puanı:</b> %20 satır kapsama, %15 domain kapsama, %5 kararlılık, %15 backend davranış testi, %35 mutasyon skoru (çekirdek mantığa kasıtlı hata sokulup testlerin yakalama oranı; kapsamayla aynı eşik tablosu 85/75/65/55/45).</li>
<li><b>Yayına hazırlık ayrı puanlanır</b> ve kod puanına karışmaz.</li>
<li>Puanlar eşiklerden mekanik türetilir; elle ayarlanmaz. Ağırlıklar gerekçeyle değişti: güvenlik 10→20 (kullanıcı verisi + kimlik doğrulama), test 20→25, dosya boyutu 15→8 (en kolay oyunlanan metrik).</li>
</ol>
{cat2}
{t_tbl}
<h3>Mutasyon testi ({mu['sample']} mutant örneklendi; {mu['compile_errors']} derlenemedi, {mu['equivalent']} eşdeğer çıktı, ikisi de sayılmadı)</h3>
<p>Ham sonuç: {mu['raw_killed']}/{mu['raw_valid']} yakalandı (%{mu['raw_killed_pct']}); eşdeğer mutant çıkarılınca {mu['killed']}/{mu['valid']} (%{mu['killed_pct']}). İki hesap da aynı puanı verir (75–84 arası = 9).</p>
{mut_tbl}
<div class="note">Yöntem: çekirdek dosyalara (<code>money</code>, <code>currency</code>, <code>date_time_utils</code>, selector'lar, yaşam döngüsü, modeller, <code>reminder_planner</code>, çevrimdışı kuyruk, uygulama kilidi, abonelik operasyonları) sabit tohumla rastgele operatör mutasyonları (<code>&lt;</code>↔<code>&lt;=</code>, <code>==</code>↔<code>!=</code>, <code>&amp;&amp;</code>↔<code>||</code>, <code>+</code>↔<code>-</code>, <code>true</code>↔<code>false</code>) uygulandı; ilgili test paketi çalıştırıldı, zaman aşımı "yakalandı" sayıldı. Hayatta kalanlar tek tek incelendi: biri kanıtlanmış eşdeğer mutant (<code>diff &lt;= 0</code>, öndeki <code>diff == 0</code> koşulu yüzünden), ikisi gerçek test boşluğu: <code>DateTimeUtils.addMonthsClamped</code> (yalnızca <code>preferredDay</code> verilmeyince kullanılıyor, bu yol tam pakette de test edilmiyor) ve <code>AppLockService.disable()</code> sonrası <code>_enabled</code> durumu. Örnek çok küçüktür (11 geçerli mutant, güven aralığı geniş); ilk deneme 20 mutant içinde 8'i, jenerik tip <code>&lt;</code> işaretine denk geldiği için derlenemedi. Mutasyon aracı yalnızca test paketinin bir alt kümesini çalıştırdı; hayatta kalan mutantı tam pakette (738 test) de yeniden denedim, yine yakalanmadı. Tam mutasyon taraması değildir.</div>
{sec_tbl}
<div class="note">Güvenlikte v1 8.3 puanı, açık düşük bulguları (hata metni sızıntısı, CORS <code>*</code>, doğrulanmayan <code>category</code>) ve doğrulanmamış kritik kontrolleri (RLS politikalarının gerçek DB'ye karşı davranış testi, cihazda secure-storage geçişi/R8) hesaba katmıyordu. Canlı advisor artık gerçek: 0 hata, 5 uyarı; bunların 4'i incelenmiş tasarım gereği RPC uyarısı, 1'i aksiyon gerektiriyor (Leaked Password Protection).</div>
{rel_tbl}
<div class="note warn"><b>Yayına hazırlık düşük çünkü:</b> release derlemesi Play anahtarı yoksa debug keystore'a düşüyor; release APK gerçek cihazda (bildirim, biyometri, R8, secure-storage geçişi) doğrulanmadı; iOS build hiç alınmadı; GitHub'daki son "Mobile quality gate" koşusu (2026-09-28) kırmızıydı (o an izlenmeyen <code>app_offline_banner.dart</code>, sonradan eklendi) ve 12 yerel commit itilmediği için güncel HEAD CI'da hiç koşmadı.</div>
<div class="note"><b>v2'nin sınırları:</b> tek geliştirici, tek kod tabanı; eşikler hâlâ öznel seçim. Bağımsız çapraz doğrulama yalnızca tekrarda (jscpd) yapıldı. Karmaşıklık, mimari ve boyut için ikinci bağımsız araç yok. Erişilebilirlik, çok dillilik, bağımlılık zafiyet taraması (osv) ölçülmedi ve puanlanmadı.</div>
"""

head_cards = None
if A2:
    rows_sum = []
    for k in A2['weights_v2']:
        bb = base['category_scores'].get(k) if base else None
        v1c, v2c = A2['v1_categories'].get(k), A2['v2_categories'].get(k)
        rows_sum.append([A2['labels_v2'][k], f"{A2['weights_v2'][k]}%", f'<span class="pill {cls(bb)}">{sc(bb)}</span>',
                         f'<span class="pill {cls(v1c)}">{sc(v1c)}</span>', f'<span class="pill {cls(v2c)}">{sc(v2c)}</span>'])
    cat_html = table(['Kategori', 'v2 ağırlık', 'HEAD baseline (v1)', 'Şimdi, v1 (eski rubrik)', 'Şimdi, v2 (GEÇERLİ)'], rows_sum, right=(1, 2, 3, 4))
    head_cards = (f'<div class="card big"><b>{sc(A2["v2_overall"])}</b><span>KOD KALİTESİ — v2 (geçerli puan)</span></div>'
                  f'<div class="card big"><b>{sc(A2["release"]["score"])}</b><span>YAYINA HAZIRLIK (ayrı puan)</span></div>'
                  f'<div class="card big"><b>{sc(A2["v1_overall"])}</b><span>v1 eski rubrik (şişirilmiş; yalnızca karşılaştırma)</span></div>'
                  f'<div class="card big"><b>{covm.get("corrected_pct")}%</b><span>düzeltilmiş satır kapsama</span></div>')

overall_b = base['overall'] if base else None
overall_c = cur['overall']

APK = ext_c.get('apk_note', '')

page = f'''<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SubscriptTrack Ölçülmüş Kalite Raporu</title>
<style>
:root{{--bg:#f6f7fb;--card:#fff;--ink:#1b1f2a;--mut:#5d6578;--line:#e3e6ef;--acc:#4f46e5;--good:#16a34a;--mid:#ca8a04;--bad:#dc2626}}
@media(prefers-color-scheme:dark){{:root{{--bg:#0f1218;--card:#181c25;--ink:#e8ebf3;--mut:#9aa3b8;--line:#2a3040;--acc:#818cf8}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,Segoe UI,Roboto,sans-serif}}
.wrap{{max-width:1080px;margin:0 auto;padding:24px 16px 80px}}
h1{{font-size:28px;margin:0 0 4px}}h2{{font-size:21px;margin:40px 0 12px;padding-top:8px;border-top:2px solid var(--line)}}h3{{font-size:16px;margin:22px 0 8px}}
.sub{{color:var(--mut)}}.card{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}}
.grid{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}
.big b{{display:block;font-size:34px}}.big span{{color:var(--mut);font-size:13px}}
table{{width:100%;border-collapse:collapse;font-size:14px;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin:8px 0}}
th,td{{padding:7px 10px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}}th{{background:var(--bg);font-size:12px;text-transform:uppercase;color:var(--mut)}}
td.r,th.r{{text-align:right;font-variant-numeric:tabular-nums}}
.pill{{display:inline-block;min-width:44px;text-align:center;padding:2px 8px;border-radius:99px;font-weight:700;color:#fff}}
.pill.good{{background:var(--good)}}.pill.mid{{background:var(--mid)}}.pill.bad{{background:var(--bad)}}.pill.na{{background:#888}}
code{{background:var(--bg);border:1px solid var(--line);padding:1px 5px;border-radius:5px;font-size:12.5px}}
.note{{background:var(--card);border:1px dashed var(--line);border-radius:10px;padding:10px 14px;color:var(--mut);font-size:13.5px;margin:10px 0}}
.warn{{border-left:4px solid var(--bad)}}
nav{{position:sticky;top:0;background:var(--bg);padding:10px 0;z-index:5;border-bottom:1px solid var(--line);display:flex;gap:14px;flex-wrap:wrap;font-size:13px}}nav a{{color:var(--acc);text-decoration:none}}
</style></head><body><div class="wrap">
<h1>SubscriptTrack — Ölçülmüş Kalite Raporu</h1>
<div class="sub">2026-09-29 · <b>Geçerli puan v2'dir</b> (<code>tools/quality/audit_v2.py</code>, bölüm 1b); v1 (<code>rubric.py</code>) yalnızca karşılaştırma içindir. Her puan bir araç çıktısından ve önceden yazılmış eşiklerden türetilmiştir. Önceki raporlardaki öznel puanlar bu raporla geçersizdir.</div>
<nav><a href="#ozet">Özet</a><a href="#hakkaniyet">Hakkaniyet (v2)</a><a href="#yontem">Yöntem</a><a href="#kat">Kategoriler</a><a href="#guv">Güvenlik</a><a href="#perf">Performans</a><a href="#duzeltilen">Düzeltilenler</a><a href="#bulgu">Bulgular</a><a href="#sinir">Sınırlar</a><a href="#tekrar">Yeniden üretme</a></nav>

<h2 id="ozet">1. Özet</h2>
<div class="grid">
{head_cards or ''}
</div>
{cat_html}
<div class="note"><b>Önceki öznel puanlarla karşılaştırma:</b> daha önce "Test disiplini 8.5" demiştim; ilk ölçümde düzeltilmiş kapsama %60,5 çıktı ve bu puan geçersiz kaldı. Bu turda kapsama düşük alanlara test yazılarak %{covm.get('corrected_pct')} seviyesine çıkarıldı (aşağıdaki "Bu turda düzeltilenler"). Bu turda doğrudan bağımlılıklar güncellendi ({outdated['major_behind']}/{outdated['direct']} ana sürüm geride) ve uzun/karmaşık metotlar bölündü (60 satırı aşan metot %{cur['complexity_detail']['lines_over_60_pct']}). 1000 abonelikte selector yeniden hesabı {bench['notify_selectors_ms'] if bench else '?'} ms ölçüldü. Bu sayfadaki puanlar geçerlidir.</div>
{audit_html}
<div class="note warn"><b>Baseline uyarısı:</b> HEAD (son commit) kendi başına tutarlı değil: <code>flutter analyze</code> 2 hata veriyor (commit edilmemiş <code>app_offline_banner.dart</code> eksik) ve 3 test dosyası yüklenemiyor. Baseline, kullanıcının commit edilmemiş çalışmasını içermez; "önce" durumu tam olarak bu değildir, yalnızca aynı araçlarla ölçülebilen en yakın referanstır.</div>

<h2 id="yontem">2. Yöntem ve v1 rubriği (v2 farkları bölüm 1b'de)</h2>
<p>Ölçüm araçları <code>tools/quality/</code> altındadır: <code>measure_static.py</code> (boyut, import grafiği, katman ihlali, tekrar, bakım), <code>complexity/</code> (Dart <code>analyzer</code> AST ile metot karmaşıklığı), <code>coverage.py</code> (lcov), gitleaks, <code>flutter pub outdated</code>, migration SQL taraması, <code>benchmark/controller_benchmark_test.dart</code>. Kategori puanı metrik puanlarının ortalaması, genel puan ağırlıklı ortalamadır; ölçülemeyen metrik ortalamaya katılmaz.</p>
{table(['Metrik','10','8','6','4','2'],[
['Analyzer sorunu','0','≤5','≤20','≤50','>50'],
['En büyük dosya (satır)','≤300','≤400','≤600','≤900','>900'],
['300 satırı aşan dosya %','≤2','≤5','≤10','≤20','>20'],
['CC>10 metot % / 60 satırı aşan metot %','0','≤1','≤3','≤6','>6'],
['En yüksek metot CC','≤10','≤15','≤25','≤40','>40'],
['Dosya import döngüsü','0','1 (7)','≤3 (5)','≤6 (3)','>6'],
['Katman ihlali','0','≤3 (7)','≤10 (4)','—','>10'],
['En yüksek fan-out','≤15','≤25','≤35','—','>35'],
['Tekrar %','≤3','≤5','≤8','≤12','>12'],
['Kapsama % (9: ≥75, 10: ≥85)','≥85','≥65','≥55','≥45','<45'],
['gitleaks bulgusu (gizli, anon olmayan)','0','—','—','—','≥1'],
['RLS olmayan korumasız tablo','0','—','≤1','≤3','>3'],
['Kimliksiz edge function','0','—','—','—','≥1 (3)'],
['Hız sınırsız edge function','0','≤1','≤2','≤4','>4'],
['RLS/advisor proxy uyarı (v1)','0','≤3','≤10','—','>10 (hata varsa 3)'],
['Ana sürüm geride bağımlılık','0','≤2','≤5','—','>5'],
['Dartdoc oranı %','≥50','≥35','≥20','≥10','<10'],
['load() ms (1000)','≤50','≤150','≤400','—','>400'],
['Selector yeniden hesap ms (1000)','≤5','≤20','≤60','—','>60'],
['Release APK MB','≤20','≤35','≤60','—','>60'],
])}
<p class="sub">Test kategorisi = 0,5·genel kapsama + 0,3·domain kapsama + 0,2·kararlılık. Kategori ağırlıkları: {', '.join(f'{labels[k]} {w}%' for k, w in weights.items())}.</p>

<h2 id="kat">3. Kategori kategori ölçümler</h2>
<h3>Dosya boyutu / God-file — <span class="pill {cls(cur['category_scores']['size'])}">{sc(cur['category_scores']['size'])}</span></h3>
{table(['Metrik','HEAD','Şimdi',''],size_rows,right=(1,2))}
{table(['En büyük 10 dosya (şimdi)','Satır'],top_size,right=(1,))}
<h3>Metot karmaşıklığı — <span class="pill {cls(cur['category_scores']['complexity'])}">{sc(cur['category_scores']['complexity'])}</span></h3>
{table(['Metrik','HEAD','Şimdi',''],cx_rows,right=(1,2))}
{table(['En karmaşık 10 metot (şimdi)','Metot','CC','Satır'],top_cx,right=(2,3))}
{table(['En uzun 5 metot','Metot','CC','Satır'],longest,right=(2,3))}
<div class="note">Uzun metotların çoğu Flutter <code>build</code> metotlarıdır (widget ağacı). Dosyaları bölmek dosya boyutunu düşürdü ama metot uzunluğunu büyük ölçüde değiştirmedi; bu, ölçümün açıkça gösterdiği bir eksiktir.</div>
<h3>Mimari — <span class="pill {cls(cur['category_scores']['architecture'])}">{sc(cur['category_scores']['architecture'])}</span></h3>
{table(['Metrik','HEAD','Şimdi',''],ar_rows,right=(1,2))}
<div class="note"><b>Ölçüm yöntemi:</b> başlık puanı kompozisyon kökü (<code>app/</code>, <code>main.dart</code>) hariç fan-out ile hesaplanır; HEAD puanı da baştan bu yöntemle hesaplanmıştı, böylece iki değer kıyaslanabilir. Kök dahil puan {sc(cm['architecture_score_incl_composition_root'])}: en yüksek değer <code>app/router/app_router.dart</code> (36 import) ve tüm ekranları yol tablosunda bağlamak onun görevidir. Kök hariç en yüksek fan-out {arc['max_fan_out_excl_app']} (<code>{short(arc['max_fan_out_excl_app_file'])}</code>). Gerçek bir işaret de var: <code>subscription_controller.dart</code> bağımlılığı 14'ten {arc['max_fan_out_excl_app']}'ye çıktı, yani controller artık daha çok parçayı bir araya getiriyor.</div>
{table(['En yüksek fan-out (şimdi)','İç import'],fo_rows,right=(1,))}
{table(['En yüksek fan-in (şimdi)','Bağımlı dosya'],fi_rows,right=(1,))}
<h3>Kod tekrarı — <span class="pill {cls(cur['category_scores']['duplication'])}">{sc(cur['category_scores']['duplication'])}</span></h3>
<p>{dup['duplicated_pct']}% ({dup['duplicated_lines']} / {dup['significant_lines']} anlamlı satır, {dup['window']} satırlık pencere; HEAD: {static_b['duplication']['duplicated_pct'] if static_b else '—'}%).</p>
{table(['En çok tekrar içeren dosyalar','Satır'],dup_rows,right=(1,))}
<h3>Test ve kapsama — <span class="pill {cls(cur['category_scores'].get('tests'))}">{sc(cur['category_scores'].get('tests'))}</span></h3>
{table(['Metrik','HEAD','Şimdi',''],test_rows,right=(1,2))}
{table(['Katman','Çalıştırılabilir satır (tahmini)','Kapsama %'],layer_rows,right=(1,2))}
{table(['Feature','Çalıştırılabilir satır (tahmini)','Kapsama %'],feat_rows,right=(1,2))}
{table(['En düşük kapsamlı dosyalar (≥30 satır)','Kapsama %','Satır'],low_rows,right=(1,2))}
<div class="note">Test sayısı {ext_c.get('tests_total')} ve hepsi geçiyor. Kapsama yüzdesi tek başına test kalitesini göstermez; bu yüzden v2 denetiminde mutasyon testi ve backend davranış testi eksikliği ayrıca puanlandı (bkz. bölüm 1b).</div>
<h3>Bakım / hijyen — <span class="pill {cls(cur['category_scores']['maintainability'])}">{sc(cur['category_scores']['maintainability'])}</span></h3>
{table(['Metrik','HEAD','Şimdi',''],mt_rows,right=(1,2))}

<h2 id="guv">4. Güvenlik — <span class="pill {cls(cur['category_scores']['security'])}">{sc(cur['category_scores']['security'])}</span></h2>
{table(['Kontrol','Sonuç','Not'],sec_rows)}
{table(['Doğrudan bağımlılık','Mevcut','En son','Ana sürüm geride'],dep_rows)}
<h3>Edge Function incelemesi (kimlik ve hız sınırı puanlanır; diğer maddeler elle, puana girmez)</h3>
<ul>
<li>Dört fonksiyonun hepsi JWT'yi <code>auth.getUser()</code> ile doğruluyor ve service-role sorgularını <code>user.id</code> ile kısıtlıyor (olumlu).</li>
<li><b>Düzeltildi (Orta):</b> <code>process-export</code> ve uygulama içi CSV dışa aktarma, <code>=</code>, <code>+</code>, <code>-</code>, <code>@</code>, sekme ve satır başı ile başlayan kullanıcı metinlerini (ad, not, ödeme yöntemi…) <code>'</code> önekiyle etkisizleştiriyor; tutar ve tarih sütunları etkilenmiyor, içe aktarma öneki geri alıyor. Ortak modül: <code>backend/supabase/functions/_shared/csv.js</code> (Node testli) ve <code>core/utils/csv_safety.dart</code> (Dart testli).</li>
<li><b>Düşük:</b> <code>support-catalog</code> POST'ta <code>category</code> doğrulanmıyor/uzunluk sınırı yok, istek hız sınırı yok (destek kaydı spam'i).</li>
<li><b>Düşük:</b> <code>delete-account</code>, <code>process-export</code> ve <code>support-catalog</code> hata durumunda <code>String(err)</code>/<code>error.message</code> döndürüyor (iç ayrıntı sızıntısı); <code>payment-methods</code> bunu doğru yapıyor.</li>
<li><b>Düşük:</b> <code>Access-Control-Allow-Origin: *</code> (Bearer token gerektirdiği için etkisi sınırlı).</li>
</ul>
<div class="note warn"><b>Ayrı bir bulgu (SubscriptTrack dışı):</b> Supabase MCP hesabına bağlı tek proje "Go4Talent" adlı başka bir uygulamaya aittir; SubscriptTrack'in canlı projesi (<code>tdbljrojcmyjwchawfif</code>) 2026-09-30'da dashboard üzerinden salt okunur incelendi (sonuçlar bölüm 4). Go4Talent'ta RLS'siz tablolar görülmüştü; o proje bu raporun kapsamı dışındadır, ayrıca ele alınmalıdır.</div>

<h2 id="perf">5. Performans — <span class="pill {cls(cur['category_scores'].get('performance'))}">{sc(cur['category_scores'].get('performance'))}</span></h2>
{perf_html}
<div class="note">Bunlar host makinede (Windows, Stopwatch) ölçülen mikro-benchmarklardır; cihaz, frame süresi, bellek veya açılış süresi DEĞİLDİR. Puanlanan senaryo 1000 aboneliktir (stres); tipik kullanıcı 20–100 abonelik taşır, ölçek tablosuna bakın. <code>projectedRenewals()</code> 1000 abonelikte saniyeler sürüyor ama şu an arayüzde hiçbir yerde çağrılmıyor (yalnızca testlerde); ileride takvim/projeksiyon ekranı bağlanırsa sorun olur.</div>
<p>{APK}</p>

<h2 id="duzeltilen">Bu turda düzeltilenler</h2>
<p>Düşük kapsamlı alanlara yazılan testler, kapsamayı yükseltmenin yanında aşağıdaki <b>gerçek hataları</b> ortaya çıkardı ve düzeltildi:</p>
<table>
<tr><th>Hata</th><th>Nerede</th><th>Etki</th></tr>
<tr><td>CSV formül enjeksiyonu</td><td>Edge Function <code>process-export</code> + <code>ExportDataScreen</code></td><td>Kötü niyetli abonelik adı Excel'de formül olarak çalışabilirdi</td></tr>
<tr><td>Yerel <code>sendPasswordResetEmail</code> <code>assert(false)</code> ile çöküyordu</td><td><code>auth_repository.dart</code></td><td>Debug/yerel modda şifre sıfırlama çökmesi</td></tr>
<tr><td>Şifre sıfırlama formu controller'ı dinlemiyordu</td><td><code>forgot_password_screen.dart</code></td><td>Hata mesajı ve yükleme durumu hiç görünmüyordu</td></tr>
<tr><td>Abonelik detay ekranı eski veriyi gösteriyordu</td><td><code>subscription_detail_screen.dart</code></td><td>Düzenleme/ödeme sonrası geri dönünce eski değerler</td></tr>
<tr><td>"User already registered" çevrilmiyordu</td><td><code>supabase_auth_repository.dart</code></td><td>Kullanıcıya İngilizce hata gösteriliyordu</td></tr>
<tr><td><code>1e2</code> gibi tutar sessizce 0 kaydediliyordu</td><td><code>payment_history_screen.dart</code></td><td>Yanlış (0) ödeme kaydı</td></tr>
<tr><td>Kabuk kapanırken bildirim geri çağrıları temizlenmiyordu</td><td><code>authenticated_shell.dart</code></td><td>Oturum kapandıktan sonra eski geri çağrı kalıyordu</td></tr>
<tr><td>Abonelik listesi azalan sırayla isteniyordu</td><td><code>supabase_subscription_repository.dart</code></td><td>Varsayılan sıra beklenenin tersiydi (istemci ayrıca sıralıyor)</td></tr>
<tr><td>Avatar baş harfleri ad soyaddan üretilemiyor, tek harfli adda <code>RangeError</code> riski</td><td><code>settings_screen.dart</code></td><td>Yanlış baş harf / olası çökme</td></tr>
<tr><td>Dışa aktarma ekranı dar ekranda taşabiliyordu</td><td><code>export_data_screen.dart</code></td><td>Yatay taşma</td></tr>
</table>
<p>Yapısal değişiklikler: Supabase depoları ve <code>SupabaseAuthRepository</code> isteğe bağlı <code>client</code> alır (sahte HTTP ile test edilir); <code>LocalNotificationService</code> platform çağrılarını <code>NotificationPlatform</code> arkasına aldı (zamanlama mantığı artık ana bilgisayarda test edilebilir); <code>AppCurrency</code> ölü koddan üç yerde kullanılan tek kaynağa dönüştü.</p>

<h2 id="bulgu">6. Ölçümden çıkan somut bulgular (öncelik sırasıyla)</h2>
<ol>
<li><b>Kapsama %{covm.get('corrected_pct')}:</b> en zayıf kalanlar <code>calendar</code> (%{next((v['pct'] for k, v in cov_c['by_feature'].items() if k == 'feature:calendar'), '?')}), <code>dashboard</code> (%{next((v['pct'] for k, v in cov_c['by_feature'].items() if k == 'feature:dashboard'), '?')}) ve platform bağdaştırıcısı <code>notification_platform.dart</code> (ana bilgisayarda çalıştırılamaz).</li>
<li><b>Bağımlılıklar:</b> {outdated['major_behind']}/{outdated['direct']} doğrudan paket ana sürüm geride (go_router 18, flutter_local_notifications 22, flutter_secure_storage 11 vb. güncellendi). Risk: <code>flutter_secure_storage</code> 11 Android'de EncryptedSharedPreferences'ı bıraktı; mevcut kullanıcı verisinin geçişi cihazda doğrulanmadı.</li>
<li>Destek kaydı (<code>support-catalog</code>) girdi doğrulaması ve hız sınırı (CSV injection düzeltildi).</li>
<li><b>Uzun <code>build</code> metotları:</b> %{cur['complexity_detail']['lines_over_60_pct']} metot 60 satırı aşıyor.</li>
<li><b>Tekrar %{dup['duplicated_pct']}:</b> ayrıntı yukarıdaki tabloda.</li>
<li>Git geçmişinde anon JWT (düşük risk, kalıcı).</li>
<li>Kalan (v2 denetimi): edge function hız sınırı ve 3 düşük bulgu, Leaked Password Protection kapalı, backend/edge function davranış testi yok, imzalama/cihaz/iOS/CI doğrulamaları (bölüm 1b).</li>
</ol>

<h2 id="sinir">7. Ölçülemeyenler ve sınırlar</h2>
<ul>
<li>Cihaz/emülatör performansı, açılış süresi, bellek, gerçek frame süresi: <b>ölçülemedi</b>.</li>
<li>Erişilebilirlik: yalnızca <code>Semantics()</code> sayısı bilgi olarak verildi; puanlanmadı.</li>
<li>Canlı Supabase: advisor ve tablolar 2026-09-30'da dashboard'dan salt okunur okundu; migration geçmişi canlıda boş olduğu için 001–030'un birebir uygulandığı <b>doğrulanamadı</b>. RLS politikalarının davranışı gerçek veritabanına karşı test edilmedi.</li>
<li>Karmaşıklık ölçümü kendi AST betiğimizdir (dcm/dart_code_metrics değil); tanım <code>tools/quality/complexity/bin/complexity.dart</code> içindedir.</li>
<li>Tekrar ölçümü 6 satırlık pencere hash'idir, semantik klon tespiti değildir.</li>
<li>Rubrik eşikleri tek geliştirici için kabaca seçildi; başka eşiklerle puanlar değişir. Ham veri <code>metrics/*.json</code>'dadır.</li>
</ul>

<h2 id="tekrar">8. Yeniden üretme</h2>
<pre style="background:var(--card);border:1px solid var(--line);padding:12px;border-radius:10px;overflow:auto">python tools/quality/measure_static.py mobile/lib . code-review-report/metrics/static_current.json
(cd tools/quality/complexity &amp;&amp; dart run bin/complexity.dart ../../../mobile/lib ../../../code-review-report/metrics/complexity_current.json)
(cd mobile &amp;&amp; flutter test --coverage) &amp;&amp; python tools/quality/coverage.py mobile code-review-report/metrics/coverage_current.json
(cd mobile &amp;&amp; flutter test benchmark/controller_benchmark_test.dart)
python tools/quality/score.py code-review-report/metrics
python tools/quality/build_report.py code-review-report</pre>
</div></body></html>
'''
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(page)
print('report written', len(page))
