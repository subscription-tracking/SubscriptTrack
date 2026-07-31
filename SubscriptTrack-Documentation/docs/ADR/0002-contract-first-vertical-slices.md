# ADR 0002 — Contract-first ve Dikey Dilim Geliştirme

## Durum

Accepted

## Bağlam

Backend'i tamamen bitirip mobil istemciye geçmek veya yalnızca UI tasarlamak entegrasyon riskini geç ortaya çıkarır.

## Karar

Önce domain ve API sözleşmesi tanımlanır. Mobil ve backend aynı sözleşme üzerinde paralel ilerler. Özellikler girişten veritabanına kadar dikey dilimler halinde tamamlanır.

## Sonuçlar

- Mock repository ve gerçek repository aynı arayüzü uygular.
- OpenAPI contract testleri kullanılır.
- İlk dikey dilim: giriş → abonelik ekleme → dashboard güncelleme.
