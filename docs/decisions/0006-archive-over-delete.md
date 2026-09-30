# ADR 0006 — Normal Akışta Silme Yerine Arşivleme

## Durum

Accepted. **Uygulamada kısmen uyulmuyor (2026-09-30):** arayüz herhangi bir abonelik için "Kalıcı olarak sil" sunuyor ([MOBILE.md §6](../architecture/MOBILE.md)); ürün sahibinin kararı bekleniyor (kararı değiştirmek için yeni ADR açılır).

## Bağlam

Kullanıcı iptal ettiği aboneliğin geçmişini ve tasarrufunu görmek ister. Fiziksel silme geçmişi yok eder.

## Karar

Normal yaşam döngüsünde cancel, expire ve archive durumları kullanılır. Fiziksel silme yanlış kayıt veya hesap/veri silme workflow'u içindir.

## Sonuçlar

- Audit ve tasarruf geçmişi korunur.
- Liste sorguları archived kayıtları varsayılan dışlar.
- Gizlilik kapsamında gerçek silme yine desteklenir.
