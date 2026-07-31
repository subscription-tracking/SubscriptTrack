# Guncel proje durumu

Son guncelleme: 31 Temmuz 2026

## Dogrulanmis durum

- Flutter stable 3.44.8 ve Dart 3.12.2 kullaniliyor.
- Android debug APK basariyla uretiliyor ve emulator'e kuruluyor.
- `flutter analyze` basarili.
- Mobil widget smoke testi basarili.
- Sprint 0 app shell, tema, navigation ve environment iskeleti hazir.
- Dashboard, Takvim, Abonelikler ve Profil sekmeleri UI prototipi olarak aciliyor.
- Abonelik ekleme formu demo validasyonla aciliyor.

## Tamamlanmamis kisimlar

- Auth repository/controller, secure storage ve token refresh yok.
- API client ve endpoint katmani bos.
- Subscription domain, repository, local cache ve state yonetimi bos.
- Dashboard verisi ve Money/billing-cycle hesaplamalari bagli degil.
- Takvim occurrence verisi ve bildirim merkezi bagli degil.
- Push, e-posta, export, hesap silme ve analytics yok.
- iOS build/signing dogrulanmadi.
- Backend uygulamasi ve staging ortami bu workspace'te yok.

## Sonraki gercek dikey dilim

Sprint 1: Auth ve onboarding. Demo auth ekranlari gercek API sozlesmesi,
secure storage, session restore, token refresh ve navigation guard ile
degistirilmelidir.

## Build komutlari

```powershell
cd D:\SubscriptTrack\mobile
puro --env stable flutter analyze
puro --env stable flutter test
puro --env stable flutter build apk --debug
```

