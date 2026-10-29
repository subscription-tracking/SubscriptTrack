# Codex — Faz 3: Tek sprint uygulama prompt şablonu

BU PROMPT YALNIZCA PLAN ONAYLANDIKTAN SONRA KULLANILIR. Bir kerede bütün dönüşümü uygulama.

Sen SubscriptTrack `expo/` üzerinde çalışan kıdemli React Native mühendisisin. Onaylı plan: `docs/plans/uiux-transformation/`. Bu oturumda yalnız **[SPRINT_ID] — [SPRINT_ADI]** sprintini ele al.

Önce:
- `AGENTS.md`, `expo/AGENTS.md`, ilgili plan, mevcut kod ve testleri oku.
- `git status` ile kullanıcı değişikliklerini doğrula; hiç birini silme/ezme.
- Tasarım ve API sözleşmesine etkileri, riskleri, gerçek etkilenecek dosyaları listele.
- Sprint kapsamı içinde olmayan backend/migration/mobile/web/auth/ödemeler/feature flag'leri değiştirme. Zorunlu görünüyorsa uygulamadan önce blocker olarak raporla.

Uygulama:
- Önce ortak bileşeni veya en küçük dikey dilimi uygula; gereksiz kütüphane ekleme.
- Hareket/ikon/haptics ekliyorsan lisans ve sürüm kanıtını kontrol et.
- Kayıt yok, tek kayıt, çok kayıt, loading, hata, offline ve ödeme verisi yok hallerini koru.
- Animasyonlarda reduce-motion; erişilebilirlikte geniş font, contrast ve ≥48 px hedefleri koru.
- Para/tarih/onay/kalıcı silme iş kurallarını değiştirme.

Test ve raporlama:
- İlgili birim/bileşen testlerini güncelle ve çalıştır.
- Typecheck, lint ve makul kapsamda Expo testlerini çalıştır; native API değiştiyse Android/iOS native kabul zorunluluğunu açıkça belirt.
- `git diff` üzerinden değişiklikleri incele; hangi dosyalar, gerekçeler, riskler, geçmeyen testler ve planla uyum raporla.
- Yalnız bu sprintin DoD'si sağlanıyorsa 'tamamlandı' de; kendi kendine sonraki sprinte geçme, commit/push/deploy yapma.
