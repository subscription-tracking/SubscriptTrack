# ADR 0005 — UTC Saklama ve Kullanıcı Zaman Dilimi

## Durum

Accepted

## Bağlam

Yenileme ve bildirim günü kullanıcı yerel saatine bağlıdır. Tek timezone varsayımı yanlış teslimata yol açar.

## Karar

Bütün timestamp'ler UTC saklanır. Kullanıcı profili IANA timezone taşır. Bildirim planı ve tarih gösterimi bu timezone ile çözülür.

## Sonuçlar

- DST ve gün sınırı testleri zorunludur.
- Timezone değişimi occurrence planlarını etkileyebilir.
- Mobil istemci yalnızca cihaz timezone'una körü körüne güvenmez.
