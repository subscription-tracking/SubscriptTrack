# Mobil Uygulama Mimarisi

## 1. Hedef

Tek bir mobil kod tabanından iOS ve Android için sürdürülebilir, test edilebilir ve tasarım sistemiyle uyumlu uygulama geliştirmek.

Framework seçimi ADR ile yapılacaktır. Bu dokümandaki prensipler Flutter, React Native veya benzeri yapılara uygulanabilir.

## 2. Mimari yaklaşım

Önerilen yaklaşım:

- Feature-first klasörleme
- Presentation / application / domain / data ayrımı
- Repository abstraction
- Tek yönlü veri akışı
- Immutable UI state
- Dependency injection
- Design system ayrı modül

## 3. Klasör yapısı

```text
src/
├── app/
│   ├── bootstrap/
│   ├── navigation/
│   ├── localization/
│   └── app_state/
├── core/
│   ├── design_system/
│   ├── networking/
│   ├── storage/
│   ├── analytics/
│   ├── errors/
│   ├── auth/
│   └── time/
├── features/
│   ├── onboarding/
│   ├── authentication/
│   ├── dashboard/
│   ├── subscriptions/
│   ├── calendar/
│   ├── notifications/
│   ├── savings/
│   └── settings/
└── shared/
    ├── models/
    └── utilities/
```

Bir feature içi:

```text
subscriptions/
├── presentation/
│   ├── screens/
│   ├── components/
│   └── state/
├── application/
│   └── use_cases/
├── domain/
│   ├── entities/
│   ├── value_objects/
│   └── repositories/
└── data/
    ├── remote/
    ├── local/
    ├── dto/
    └── repositories/
```

## 4. Katman sorumlulukları

### Presentation

- Widget/view/component
- UI state
- Kullanıcı olayı üretme
- Formatlanmış veriyi gösterme

### Application

- Use case koordinasyonu
- Loading/error/success akışı
- Birden fazla repository çağrısını birleştirme

### Domain

- Framework bağımsız entity ve kurallar
- Para, durum, döngü gibi value object'ler
- Repository arayüzleri

### Data

- REST API istemcisi
- Local database/cache
- DTO ↔ domain mapping
- Retry ve sync

## 5. Repository örneği

```text
SubscriptionRepository
- list(filters)
- get(id)
- create(command)
- update(id, command)
- pause(id)
- resume(id)
- cancel(id, command)
- archive(id)
```

UI doğrudan HTTP istemcisini çağırmamalıdır.

## 6. State yönetimi

Her ekran en az şu durumları modellemelidir:

- initial
- loading
- content
- empty
- refreshing
- offline-content
- recoverable-error
- blocking-error

State içinde domain entity yerine gerekirse ekran modeli kullanılabilir.

## 7. Navigation

Alt navigasyon:

- Ana Sayfa
- Takvim
- Abonelikler
- Profil

Global yollar:

```text
/onboarding
/auth
/home
/calendar
/subscriptions
/subscriptions/:id
/subscriptions/new
/notifications
/settings
/account/privacy
```

Deep link şeması:

```text
subscripttrack://subscriptions/{id}
subscripttrack://notifications/{id}
```

Universal/App Links web domainiyle eşleştirilmelidir.

## 8. Local storage

Saklanabilecek veriler:

- Son abonelik listesi
- Dashboard özeti
- Kategori ve servis katalog cache'i
- Tema ve locale
- Auth sağlayıcısının güvenli oturum bilgisi
- Bekleyen form taslağı

Token ve hassas veriler platform secure storage içinde tutulur.

## 9. Offline davranış

MVP:

- Offline son veriyi görüntüleme
- Offline banner
- Başarısız yazmada form verisini koruma
- Bağlantı geldiğinde manuel/otomatik tekrar

Sonraki aşama:

- Local outbox
- Conflict resolution
- Background sync

## 10. Push bildirim

- Cihaz tokenı backend'e kaydedilir.
- Token refresh dinlenir.
- Logout ve hesap silmede token revoke edilir.
- Foreground bildirim uygulama içi banner olarak gösterilebilir.
- Bildirime dokunma deep link'e çevrilir.
- Yetki istemeden önce açıklayıcı pre-permission ekranı gösterilir.

## 11. Hata yönetimi

Teknik hata kullanıcıya ham olarak gösterilmez.

Hata kategorileri:

- network unavailable
- timeout
- unauthorized/session expired
- validation
- domain conflict
- server unavailable
- unknown

Her hata merkezi olarak loglanır; hassas payload loglanmaz.

## 12. Tasarım sistemi entegrasyonu

Ekranlarda ham renk, radius veya spacing değeri kullanılmaz.

```text
Foundation tokens
→ primitive components
→ product components
→ patterns
→ screens
```

## 13. Performans

- Liste sanallaştırma
- Logo image cache
- Dashboard çağrılarını gereksiz tekrarlamama
- Pagination
- Uygulama açılışında kritik veri önceliği
- Büyük JSON modellerinden kaçınma

## 14. Erişilebilirlik

- Dynamic type / font scaling
- Screen reader label
- Minimum dokunma alanı
- Renk dışında ikon/metinle durum
- Yeterli kontrast
- Motion azaltma tercihine saygı

## 15. Test piramidi

- Domain unit testleri
- Repository testleri
- State/use case testleri
- Component snapshot/golden testleri
- Kritik akış E2E testleri

## 16. Build ve ortamlar

- Development
- Staging
- Production

Bundle ID/application ID, API base URL, analytics ve push yapılandırması ortam bazında ayrılır. Secret'lar kaynak koda eklenmez.
