# SubscriptTrack Mobile

Flutter uygulamasının iOS ve Android istemcisi ile tarayıcıdaki geliştirme önizlemesi bu klasördedir. Tarayıcı hedefi bir ürün dashboard'u değildir.

## Çalıştırma

```bash
flutter pub get
flutter run
```

Chrome'da önizleme:

```bash
flutter run -d chrome
```

Kök dizindeki `start-web.bat` veya `start-web.sh` aynı komutu platforma uygun kontrollerle çalıştırır.

## Ortamlar

`SUPABASE_URL` ve `SUPABASE_ANON_KEY` isteğe bağlı olarak `.env` üzerinden `--dart-define-from-file=.env` ile verilir. Bu değerler yoksa uygulama yerel auth ve depolama fallback'iyle açılır. Secret'lar repoya eklenmez.

```bash
flutter run -d chrome --dart-define-from-file=.env
```

Detaylı kurulum, mobil başlatma ve doğrulama komutları için kökteki [README](../README.md) dosyasına bakın.
