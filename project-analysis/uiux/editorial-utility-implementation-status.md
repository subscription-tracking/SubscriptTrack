# Editorial Utility — uygulama ve kabul durumu

Tarih: 29 Ekim 2026. Bu dosya çalışma ağacındaki tamamlanmamış dönüşümün durum kaydıdır; görsel kabul raporu değildir. Çalışma ağacı başka kullanıcı değişiklikleri de içerir; tüm diff bu çalışmaya atfedilemez.

## Kod ve otomatik doğrulama

- Ana sayfa: `expo/src/features/dashboard/ui/` içinde aylık ödeme özeti, yükleme/hata ve yeniden deneme, para birimi kapsamı, yaklaşan olaylar ve dikkat gerektirenler güncellendi. Tutar ve tarih hesapları için mevcut domain katmanı kullanılmaya devam eder.
- Liste, form, takvim, istatistik, ödeme geçmişi, tasarruf, bildirim ve ayar akışlarında ortak bileşenler ve satır düzenleri üzerinde değişiklikler var. Kaynak ve mevcut diff incelemesi gerekir; geçmişte kullanıcı tarafından değiştirilmiş abonelik detay dosyaları ayrı değerlendirilmelidir.
- Ortak alan, seçim ve hata durumlarına erişilebilirlik etiketleri eklendi. Bu, gerçek TalkBack veya VoiceOver davranışını kanıtlamaz.
- Son tam koşu: `npm test -- --runInBand --silent`, 148 paket / 914 test geçti. Son yerel tür kontrolü ve lint geçti; testler native görsel yerleşimi ölçmez.
- Graphify kod grafiği artımlı güncellendi; SQL çıkarımı eksik parser nedeniyle tamamlanmadı, doküman ve görsel çıkarımı yapılmadı.

## Açık kabul maddeleri

| Gereksinim | Mevcut kanıt | Durum |
|---|---|---|
| Onaylı dashboard prototipine gerçek native görsel uyum | HTML prototipi mevcut; güncel Expo ekran görüntüsü yok | Doğrulanmadı |
| Tüm ekranlar ve açık/koyu temada tutarlı kompozisyon | Kaynak ve kısmi uygulama değişiklikleri | Uçtan uca görsel kabul eksik |
| Android/iOS, küçük/büyük ekran ve 1,3×+ yazı | 29 Ekim `adb devices -l`: bağlı cihaz listesi boş. Android emulator aracı mevcut ancak `-list-avds` boş; iOS cihaz kanıtı yok | Doğrulanmadı |
| TalkBack/VoiceOver, odak sırası ve modal geri dönüşü | Otomatik bileşen testleri | Cihaz testi eksik |
| Klavye, yerel tarih/saat seçici, bildirim izinleri | Birim testleri; native platform etkileşimi yok | Cihaz testi eksik |
| 0/1/çok, gecikme, deneme, çok para birimi, offline ve hata görselleri | Kod testleri ve bağımsız sentetik HTML prototipi | Güncel native fixture ve ekran görüntüsü eksik |
| Performans ve 1000 kayıt | Güncel ölçüm yok | Doğrulanmadı |

Test hesapları ve fixture kurulmadan kişisel veya canlı verilere erişilmemelidir. Ayrıntılı yakalama ve kabul koşulları: [görsel kanıt matrisi](phase-1-5/07-visual-evidence-and-acceptance.md). Kullanıcı değişiklikleri korunmalı; Flutter, backend, bağımlılıklar ve deployment bu çalışma kapsamında değiştirilmemelidir. Bu kayıt, yukarıdaki maddeler doğrulanana kadar tamamlanma iddiası değildir.
