# ADR 0006 — Normal Akışta Silme Yerine Arşivleme

## Durum

Accepted

## Bağlam

Kullanıcı iptal ettiği aboneliğin geçmişini ve tasarrufunu görmek ister. Fiziksel silme geçmişi yok eder.

## Karar

Normal yaşam döngüsünde cancel, expire ve archive durumları kullanılır. Fiziksel silme yanlış kayıt veya hesap/veri silme workflow'u içindir.

## Sonuçlar

- Audit ve tasarruf geçmişi korunur.
- Liste sorguları archived kayıtları varsayılan dışlar.
- Gizlilik kapsamında gerçek silme yine desteklenir.
