# SubscriptTrack Güncel Durum Raporu

**Rapor zamanı:** 2026-08-02 21:10:26 +03:00  
**Kapsam:** `mobile/`, `backend/`, CI, migrationlar, dokümanlar ve Graphify kod grafiği.

## Yönetici özeti

SubscriptTrack; abonelik yönetimi, yaşam döngüsü, dashboard, takvim, tasarruf,
export, ayarlar, yerel yenileme bildirimleri, offline kuyruk ve REST API
abonelik sözleşmesini içeren Flutter mobil uygulamasıdır.

Bu rapor tarihinde mobil istemcide harici push sağlayıcısı bağımlılığı yoktur.
Uygulama cihaz üzerinde planlanan yerel yenileme bildirimlerini kullanır.
Backend'deki cihaz-kayıt endpoint'i ve veri modeli gelecekteki bir sağlayıcı için
korunur; mevcut mobil istemci bu endpoint'i çağırmaz.

## Doğrulanan durum

| Kontrol | Sonuç |
|---|---|
| Flutter analiz | Başarılı: `dart analyze lib` hata yok |
| Hedefli Flutter testleri | Başarılı: 36/36 |
| Test envanteri | `mobile/test` altında 194 test tanımı |
| Backend test altyapısı | Başarılı: Node test runner + CI quality gate |
| Harici sağlayıcı runtime referansı | Bulunamadı |
| Paket çözümü | Başarılı; mobil istemcide sağlayıcı paketi yok |
| Kod grafiği | 1.289 düğüm, 1.759 ilişki, 94 topluluk |

## Mimari durumu

- Flutter, Provider, GoRouter, Supabase Auth ve REST `ApiClient` kullanılır.
- Para için `Money` minor-unit modeli vardır; mobil API taşıması ondalık metin,
  backend hesaplamaları ise sabit ölçekli `BigInt` ile yapılır.
- Offline önbellek ve FIFO mutation replay vardır; conflict/backoff gerçek ağda
  doğrulanmamıştır.
- Bildirimler yerel zamanlanmış hatırlatıcılar ve uygulama içi merkezden oluşur.
- Backend Express, PostgreSQL, bearer auth, rate limit, CORS, health/readiness
  ve request telemetry sağlar.

## Sprint ve yayın durumu

S0–S19 geliştirme planında tamamlandı olarak işaretlidir. P1 teknik altyapısı da
tamamlandı: backend test runner, checksum'lı migration kaydı ve staging smoke aracı eklendi. Bu, dış ortam
kapılarının tamamlandığı anlamına gelmez. İmzalı Android AAB, iOS archive/signing,
staging API/veritabanı smoke testi ve mağaza dağıtımı henüz doğrulanmış değildir.

## Açık işler

1. Staging üzerinde smoke aracını ve mobil CRUD/lifecycle/offline replay kontrolünü çalıştırmak.
2. İmzalı Android ve iOS release doğrulamalarını tamamlamak.
3. Gelecekte harici push istenirse sağlayıcı seçimi ve gizlilik değerlendirmesini yapmak.

## Nesnel olgunluk puanı

| Boyut | Puan |
|---|---:|
| Özellik kapsamı | 8,0/10 |
| Kod kalitesi | 7,0/10 |
| Entegrasyon kanıtı | 6,0/10 |
| Release hazırlığı | 3,5/10 |

Bu rapor, önceki dokümanlardaki başarı beyanlarını kanıt kabul etmez; mevcut kod
ve yukarıdaki doğrulama çıktıları üzerinden hazırlanmıştır.
