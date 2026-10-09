# ADR 0010 — Expo (React Native) Sürümünün Flutter Sürümüne Paralel Geliştirilmesi

## Durum

Accepted. [ADR 0008](0008-flutter-mobile-framework.md) yürürlüktedir; bu karar onu geçersiz kılmaz. Nihai framework seçimi, iki sürümün karşılaştırılmasından sonra ayrı bir ADR ile verilir ([ROADMAP Aşama 8](../expo/ROADMAP.md)).

## Bağlam

- Flutter sürümü hiç derlenmiş bir iOS build'e sahip değildir ([CURRENT_STATUS](../CURRENT_STATUS.md)). Geliştirme ortamı Windows'tur ve iOS derlemesi macOS/Xcode gerektirir.
- Expo ile iOS paketi EAS Build üzerinden bulutta alınabilir; Windows'ta geliştirme sürer.
- Mevcut Flutter kodunu silmeden veya bozmadan karşılaştırılabilir ikinci bir uygulama gerekir.

## Karar

- Expo sürümü `expo/` klasöründe, React Native + TypeScript + Expo Router ile geliştirilir.
- Flutter sürümü (`mobile/`) bu süreçte değiştirilmez ve yeni özellik almaz.
- Backend değişmez: aynı Supabase projesi, aynı şema, RLS, RPC, Edge Function ve Realtime sözleşmesi ([API.md](../reference/API.md)). Expo istemcisi yalnızca bu yüzeyleri kullanır.
- Para ([ADR 0004](0004-money-as-decimal.md)), tarih ([ADR 0005](0005-utc-and-user-timezone.md)), archive-over-delete ([ADR 0006](0006-archive-over-delete.md)) ve yalnızca yerel bildirim ([ADR 0009](0009-supabase-only-architecture.md)) kuralları Expo sürümünde de aynen uygulanır.
- Kapsam Flutter sürümüyle birebir eşleşir ([PARITY](../expo/PARITY.md)).

## Sonuçlar

- Aynı backend iki istemciye hizmet eder; API sözleşmesinde yapılan her değişiklik iki istemciyi de etkiler.
- Repoda iki mobil kod tabanı bakımı doğar. Aşama 8 kararına kadar bu maliyet kabul edilmiştir.
- `expo/` klasöründe Expo SDK'nın kendi kuralları geçerlidir ([expo/AGENTS.md](../../expo/AGENTS.md)).
- Bildirim paketi farkı: Flutter'da `flutter_local_notifications`, Expo'da `expo-notifications`. Her iki sürüm de yalnızca yerel bildirim kullanır.
- Peer bağımlılık çakışması (Expo Router'ın isteğe bağlı `react-dom` peer'i) `--legacy-peer-deps` ile kurulur; [SETUP.md](../expo/SETUP.md) bunu açıklar.

## Reddedilen alternatifler

- **Flutter'da devam, yalnızca bulut build:** iOS derlemesi çözülür ama Expo'nun hızlı gerçek cihaz denemesi ve paket ekosistemi kazanımı kaybolur. Karar Aşama 8'e bırakılmıştır.
- **Expo'ya hemen geçiş ve Flutter'ın silinmesi:** Kanıtlanmamış bir geçiş riskidir; iki sürüm karşılaştırılmadan geri dönüşü zorlaştırır.
- **Ayrı repo:** Backend ve dokümanların bölünmesine yol açar; tek doküman kökü kuralıyla çelişir ([docs/README.md](../README.md)).
