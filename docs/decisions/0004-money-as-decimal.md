# ADR 0004 — Para Değerlerinin Decimal Olarak Saklanması

## Durum

Accepted

## Bağlam

Binary floating point finansal değerlerde yuvarlama hatası üretir.

## Karar

Veritabanında `NUMERIC/DECIMAL`, domain katmanında Money value object kullanılır. API para değerini string olarak taşır ve para birimi ayrı ISO 4217 kodudur.

## Sonuçlar

- Mobil ve backend mapping açık olur.
- Yuvarlama yalnızca tanımlı sınırda yapılır.
- Farklı para birimleri otomatik toplanmaz.
