# ADR 0008: Flutter mobil framework'ü

## Durum

Kabul edildi

## Karar

SubscriptTrack mobil uygulaması iOS ve Android için Flutter ile geliştirilecektir.

## Gerekçe

- Ortak bir kod tabanı ile iki mobil platformda tutarlı davranış sağlanması.
- Ortak UI tokenları ve bileşenlerin yeniden kullanılabilmesi.
- Android ve iOS build doğrulamasının aynı feature diliminde yapılabilmesi.
- Domain ve application katmanlarının platformdan bağımsız tutulabilmesi.

## Sonuçlar

- Flutter stable sürümü ve Material 3 kullanılacaktır.
- Platforma özgü davranışlar gerektiğinde native plugin veya platform channel ile izole edilecektir.
- Android application ID `com.subscripttrack.app` olarak belirlenmiştir.
- Secret ve ortam değerleri kaynak koda gömülmeyecektir.

