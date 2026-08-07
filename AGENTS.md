# SubscriptTrack Agent Rules

## Proje amacı

SubscriptTrack, iOS ve Android için geliştirilen mobil abonelik takip uygulamasıdır. Web sitesi yalnızca tanıtım, yardım, iptal rehberleri ve yasal sayfalar içindir; abonelik dashboard'u web uygulaması değildir.

## Çalışma kuralları

- Önce ilgili Markdown dokümanlarını oku; özellikle `SubscriptTrack-Documentation/README.md`, `PRODUCT.md`, `ARCHITECTURE.md`, `DOMAIN.md`, `API.md` ve `MOBILE_ARCHITECTURE.md`.
- Ürün kararları ile mevcut kod çelişirse, kullanıcıdan onay almadan kapsamı genişletme. Çelişkiyi raporla ve ilgili dokümanı işaret et.
- Mobil istemci ile backend arasında doğrudan veritabanı bağlantısı kurma; API sözleşmesini kullan.
- iOS ve Android davranışlarını birlikte düşün. Push için `flutter_local_notifications` (uzak push/FCM kullanılmaz), tarih hesapları için UTC + kullanıcının IANA timezone'ı kullanılmalıdır.
- Para değerlerini floating point ile hesaplama; `Money`/decimal yaklaşımını koru.
- Normal abonelik yaşam döngüsünde silme yerine cancel, expire ve archive kullan. Fiziksel silme yalnızca yanlış kayıt veya hesap silme akışında kullanılabilir.
- Her yeni ekran için loading, error, empty ve offline durumlarını planla.
- Ortak UI parçalarını `mobile/lib/shared/widgets` veya `mobile/lib/app/shell` altında yeniden kullanılabilir tut.
- Yeni API, domain veya veri modeli davranışı eklenirse ilgili Markdown dokümanını aynı değişiklikte güncelle.
- Kullanıcı açıkça istemedikçe dış servis, ödeme/banka entegrasyonu veya web dashboard ekleme.

## Graphify kullanımı

Graphify bu projenin dokümantasyon, mimari ve dosya ilişkilerini incelemek için kullanılmalıdır.

### İlk kontrol

Her agent, proje hakkında mimari veya dosya ilişkisi sorusu geldiğinde önce şu dosyanın varlığını kontrol eder:

```powershell
Test-Path .\graphify-out\graph.json
```

Dosya varsa graphify graph'ını yeniden oluşturma; mevcut graph üzerinde sorgu çalıştır:

```powershell
graphify query "SORU"
```

Dosya yoksa ve kapsamlı bir kod/doküman analizi gerekiyorsa graphify kurulumu ve taraması yapılır. Graphify sistemde yoksa Python ortamına `graphifyy` kurulabilir. API anahtarı yoksa agent çalışmayı durdurmaz; dokümanları kendi bağlamında analiz eder ve graph üretilemediğini açıkça belirtir.

### Güncelleme

Dosya değişikliklerinden sonra tam rebuild yerine mümkünse:

```powershell
graphify . --update
```

Graphify çıktıları `graphify-out/` altında tutulur. `graphify-out/graph.json`, `GRAPH_REPORT.md`, `graph.html` ve manifest dosyaları silinmemeli veya elle düzenlenmemelidir.

### Sorgu ilkeleri

- Graphify cevabında yalnızca graph'ın kanıtladığı ilişkileri kullan.
- Kaynak konumlarını mümkünse belirt.
- Belirsiz ilişkileri kesin gerçek gibi yazma.
- Graph mevcutsa gereksiz full extraction çalıştırma.

## Çalışma alanı

- Mobil uygulama kökü: `mobile/`
- Mobil Dart kodu: `mobile/lib/`
- Ortak bileşenler: `mobile/lib/shared/` ve `mobile/lib/app/shell/`
- Ürün ve mimari belgeleri: `SubscriptTrack-Documentation/`
- Graphify çıktıları: `graphify-out/`

## Dosya ve değişiklik kuralları

- Kullanıcı yalnızca iskelet istediğinde dosyaları boş bırak; kod ekleme.
- Uygulama kodu istendiğinde önce ilgili boş dosyayı doldur, gereksiz yeni katman oluşturma.
- Mevcut kullanıcı değişikliklerini ezme.
- Test, dokümantasyon ve platform etkisini değişiklik özetinde belirt.
