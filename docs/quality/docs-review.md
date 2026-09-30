# Doküman incelemesi (2026-09-30)

Yöntem: `SubscriptTrack-Documentation/` içeriği kod, dosya sistemi, GitHub CI ve canlı Supabase dashboard'u (salt okunur, 2026-09-30) ile karşılaştırıldı.

**Ayrıntılı okunanlar:** README, CURRENT_STATUS, RELEASE_CHECKLIST, SPRINT_3_DEVICE_ACCEPTANCE, TESTING, DEPLOYMENT, SECURITY, ARCHITECTURE (ilk 120 satır), NOTIFICATIONS (ilk 60 satır), ADR-0003, API (başlıklar ve seçili bölümler), DATA_MODEL (başlıklar), ANALYTICS (başı), TEST_TRACEABILITY (başı), MOBILE_ARCHITECTURE (sayısal ifadeler), docs/INDEX.
**Ayrıntılı OKUNMAYANLAR:** PRODUCT, USER_FLOWS, DOMAIN, DESIGN_SYSTEM, CONTRIBUTING, GITHUB_PAGES_SUPABASE, tüm `archive/`, ADR 0001–0002 ve 0004–0008.

## A. Var olmayan bir sistemi anlatanlar (yüksek öncelik)

| Doküman | Ne diyor | Gerçek |
|---|---|---|
| API.md | `/api/v1` altında REST API (`GET /me`, `/dashboard/summary`, `POST /subscriptions/{id}/pause` …), `POST /notifications/devices` push token kaydı, "API implementasyonu OpenAPI üretmelidir" | `backend/src` yalnızca `db/` içeriyor; API sunucusu yok. Gerçek arayüz: Supabase PostgREST/RPC + 4 Edge Function (`delete-account`, `payment-methods`, `process-export`, `support-catalog`). Cihaz token kaydı yok (uzak push kullanılmıyor). |
| ARCHITECTURE.md §3, §5 | Diyagramda "Backend API", "Job / Queue", "E-posta Sağlayıcısı", `POST /v1/subscriptions` | Aynı dosyanın §4.4'ü yerel bildirimi anlatıyor; belge kendi içinde çelişiyor. |
| DEPLOYMENT.md | Staging API'ye `npm run smoke:staging` (`api-staging.example.com`, `/health`, `/ready`) | Böyle bir API yok; komut hiçbir gerçek hedefe işaret etmiyor. |
| DATA_MODEL.md | `users`, `services`, `categories`, `billing_schedules`, `device_tokens` | Canlıda 15 tablo var; `users`, `services`, `categories`, `billing_schedules` YOK, `service_catalog` var. `payment_methods`, `payment_events`, `exports`, `idempotency_keys`, `support_tickets`, `service_catalog` dokümanda yok. |
| SECURITY.md, TESTING.md | Rate limit, push token, Apple/Google sunucu tarafı doğrulama, "Türkçe ve İngilizce uzun metinler", contract/OpenAPI testi, IDOR/rate-limit testleri | Hız sınırı uygulanmadı, push yok, uygulama yalnızca Türkçe, contract/IDOR testi yok. Belge hedefi anlatıyor ama "güncel durum / hedef" ayrımı yapmıyor. |
| ANALYTICS.md | Olay sözleşmesi, north-star metrik | Kodda analitik altyapısı yok; belge bir plan ama öyle işaretlenmemiş. |

## B. Bayat sayılar ve tarihler

| Doküman | Yazan | Gerçek |
|---|---|---|
| CURRENT_STATUS.md | Flutter 3.44.8 / Dart 3.12.2 | 3.47.2 / 3.13.2 |
| CURRENT_STATUS.md | Güncel commit `733ad6b`, son güncelleme 22 Eylül | `e46c543`, 30 Eylül |
| CURRENT_STATUS.md | "Kod ve backend tamamlanmış" | Yayına hazırlık 2,8 (imza, cihaz, iOS, CI) |
| CURRENT_STATUS.md | Canlı migration listesi 028–030 | Migration 031 (RLS InitPlan) eklendi; canlıda migration geçmişi boş |
| DEPLOYMENT.md | Flutter 3.44.8 / Dart 3.12.2 | 3.47.2 / 3.13.2 |
| RELEASE_CHECKLIST.md | `flutter test` 306/306 (19 Eylül) | 738 test |
| MOBILE_ARCHITECTURE.md §187 | Toplam 409 test | 738 (kendi içinde 723 ve 738 de geçiyor) |
| MOBILE_ARCHITECTURE.md §298 | 60 satırı aşan metot 0/976 | 0/991 |
| MOBILE_ARCHITECTURE.md | "Hiçbir dosya 320 satırı aşmaz" ve "300'ü aşmaz" | İkisi de doğru (limit 320, gerçek en büyük 300) ama iki farklı sayıyla yazılmış |
| TEST_TRACEABILITY.md | Son güncelleme 19 Eylül (S39) | Sonrasında 300+ test eklendi |

## C. Eksikler

- Canlı Supabase durumu (advisor, RLS, auth ayarları, migration geçmişinin boş olması, Leaked Password Protection kapalı) hiçbir dokümanda yok.
- Repo migration zinciri (001–030, 19 tablo) ile canlı şema (15 tablo) arasında **sapma** var; hangisinin kanonik olduğu yazılı değil.
- Kalite raporu (`code-review-report/`), v2 puanlama ve mutasyon testi README haritasında yok.
- Release imzalama adımları (keystore üretimi, CI secret) RELEASE_CHECKLIST'te işaretsiz madde olarak var ama nasıl yapılacağı yok.
- SPRINT_3_DEVICE_ACCEPTANCE.md: tüm satırlar "Açık"; hiçbir cihaz kabul sonucu kaydedilmemiş.

## D. Sağlam olanlar

- README haritasındaki ve `docs/INDEX.md`'deki tüm bağlantılı dosyalar mevcut (rapor, APK, `start-web.*`, `.env.example`, smoke betikleri).
- NOTIFICATIONS.md ve ADR-0003 uzak push kullanılmadığını doğru ve tutarlı söylüyor (ADR başlığı "backend kaynaklı" yanıltıcı, karar metni doğru).
- MOBILE_ARCHITECTURE.md kod yapısını, katman kurallarını ve bağımlılıkları güncel ve ayrıntılı anlatıyor.

---

# Ek: tüm depo doküman envanteri (2. tur)

İlk tur yalnızca `SubscriptTrack-Documentation/` klasörünü kapsıyordu; bu tur tüm depo tarandı.

## Doküman yüzeyleri

| Yüzey | Dosya | Git'te mi | Durum |
|---|---|---|---|
| Kök | `README.md`, `AGENTS.md`, `setup.sh/.bat`, `start-web.*` | Evet | README bayat (Flutter 3.44.8, `outputs/` bağlantıları) |
| Mobil | `mobile/README.md`, `ios/.../README.md` | Evet | Güncel / Xcode şablonu |
| Ana doküman | `SubscriptTrack-Documentation/` (22 belge + ADR 8 + INDEX + diyagram + `database/rls_policies.sql`) | Evet | 1. turdaki bulgular |
| Arşiv | `SubscriptTrack-Documentation/archive/` (5 md + 1 json) | Evet | Tarihsel; dokunulmaz |
| Kalite raporu | `code-review-report/` (`index.html`, `screen-review.md`, `docs-review.md`, metrikler) | Evet (docs-review yeni) | Güncel |
| Teknik raporlar | `outputs/reports/` (md, 2 docx, 2 html+pdf) | **HAYIR** (`outputs/` gitignore'da) | Bayat |
| Excel | `outputs/` altında 7 xlsx (3 özellik envanteri, 4 test senaryosu) | **HAYIR** | Sürüm karmaşası |
| Denetim raporları | `outputs/audit-2026091x/` md, log, build_report.py | **HAYIR** | Tarihsel (18-19 Eylül) |
| APK | `outputs/apk/*.apk` (62 MB, 22 Eylül) | **HAYIR** | Bayat |
| Graphify | `graphify-out/` (`GRAPH_REPORT.md` 14 Eylül, `graph.json` 29 Eylül) | Hayır | Rapor ile graf tutarsız |
| Üretici betikler | `tools/build_technical_report*.py`, `tools/*.mjs` | Evet | Sabit kodlanmış eski değerler |

## Yeni bulgular

1. **`outputs/` git'te yok ama 4 izlenen belge oraya bağlanıyor** (kök README, doküman README, INDEX, CURRENT_STATUS): GitHub'da APK ve "teknik rapor" bağlantıları çalışmıyor.
2. **"latest-release" APK bayat:** 22 Eylül, 62,8 MB; sonraki tüm commit'lerden önce. Adı yanıltıcı.
3. **Sürüm bilgisi 5 izlenen dosyada bayat** (Flutter 3.44.8): README, CURRENT_STATUS, DEPLOYMENT, iki rapor üretici betik. Gerçek: 3.47.2.
4. **Aynı içerik 4 yerde kopya:** kök README, CURRENT_STATUS, `Teknik_Yapi_ve_Ozellik_Envanteri.md`, iki docx. Biri güncellenince diğerleri ayrışıyor (docx'ler commit `6e116b2`, Flutter 3.44.8).
5. **Excel karmaşası:** 3 özellik envanteri (v1/v2/v3), 4 test senaryosu dosyası (60 ve 66 satırlı). `TEST_TRACEABILITY.md` var olmayan `Abonelik_Takip_Test_Senaryolari.xlsx` adına atıf yapıyor. Test dosyalarının Özet sayfasında "Tamamlanan 0 / bekleyen 0" (formül hesaplanmamış), tarih ham sayı (46287). Envanter özet tabloları tutarsız (71 vs 70).
6. **Excel'deki "Doküman Uyumsuzlukları" sayfası** 6 bilinen sorunu 22 Eylül'de kaydetmiş (eski device token dokümanları, CSV şeması farkı, "destek" ifadesi, yerel modda şifre sıfırlama, "aktif senkronizasyon" kanıtı, hukuki onay); dokümanlar hâlâ düzeltilmedi.
4. **28 Eylül denetim raporları (HTML+PDF) bayat ve öznel:** 86 dosya, 348 test, "God File 6 dosya / %32,7"; puanlar Clean Architecture 8,8, Test 9,4, Performans 6,8, God File 5,5. Şimdi 167 dosya, 738 test, God-file yok ve puanlar ölçüme dayalı. İki çelişen kalite raporu dolaşımda.
7. **`graphify-out/GRAPH_REPORT.md` 14 Eylül,** `graph.json` 29 Eylül: rapor grafla uyumsuz.
8. **`database/rls_policies.sql`** yalnızca 6 tabloyu kapsıyor (`billing_schedules` canlıda yok; `payment_methods`, `payment_events`, `support_tickets` … yok).
9. Rapor üreten betiklerde değerler sabit yazılı (commit, Flutter sürümü): her çalıştırmada eski bilgi üretir.

---

# Çözüm durumu (3. tur: yeniden yapılandırma, 2026-09-30)

Tek doküman kökü `docs/` kuruldu; belgeler amaca göre klasörlendi ve gerçek sisteme göre yeniden yazıldı.

| Bulgu | Durum |
|---|---|
| API.md var olmayan REST API'yi anlatıyor | Çözüldü: Supabase gerçeğine göre yeniden yazıldı (`reference/API.md`), [ADR 0009](../decisions/0009-supabase-only-architecture.md) |
| ARCHITECTURE.md Backend API / Queue diyagramı | Çözüldü: yeniden çizildi, Mermaid içeride |
| DATA_MODEL canlı şemayla uyuşmuyor | Çözüldü: canlı 15 tabloya hizalandı; repo–canlı sapması belgelendi |
| Canlı Supabase durumu hiçbir yerde yok | Çözüldü: `reference/SUPABASE_LIVE_STATUS.md` |
| Bayat sürüm/test sayıları | Çözüldü: elle yazılan sayılar kaldırıldı, `tools/docs/check_docs.py` (CI: `docs-check.yml`) yeniden girmesini engeller |
| `outputs/` bağlantıları (git'te yok) | Çözüldü: bağlantılar kaldırıldı, kontrol kuralı eklendi |
| Aynı içerik 4 yerde kopya | Çözüldü: özellik durumunun tek sahibi `CURRENT_STATUS.md`; kök README özellik tablosu içermez |
| Push/token/OpenAPI/İngilizce/açık tema/analitik iddiaları | Çözüldü: durum etiketleri (Uygulandı/Kısmi/Planlı/Kapsam dışı) |
| ADR 0001–0003 güncel değil | Çözüldü: ADR 0009 eklendi, eski ADR'ler "kısmen geçersiz" işaretlendi (silinmedi) |
| GITHUB_PAGES doküman eski adres (`krayirhan.github.io`) | Çözüldü: adres düzeltildi, `RELEASE.md`'ye birleştirildi |
| MOBILE_ARCHITECTURE: yok olan `ApiClient`, `/v1/...` uç noktası, sayılar | Çözüldü: `architecture/MOBILE.md` güncel koda göre yeniden yazıldı; tarihçe `archive/ARCHITECTURE_CHANGELOG.md`'de |
| DOMAIN alan adları canlı kolonlarla uyuşmuyor | Çözüldü: kavram → veri eşleme notu eklendi |
| 28 Eylül denetim raporları (git dışı), Excel sürümleri, `graphify-out` | **Açık** (git dışı yerel dosyalar; bu turda değiştirilmedi) |
| Repo migration zinciri ile canlı şema sapması | **Açık:** baseline migration (Supabase CLI/DB erişimi gerekir), bkz. `operations/RELEASE.md` bölüm 9 |
| Web önizleme Auth yönlendirme adresi izinli listede değil | **Açık:** Supabase ayarı (canlı hesap ayarı; bu turda değiştirilmedi) |
| CI: Android release AAB derlemesi başarısız | **Açık, yeni bulgu:** `checkReleaseDuplicateClasses` / JetifyTransform; ayrıca araştırılmalı |
