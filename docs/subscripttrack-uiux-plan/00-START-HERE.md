# SubscriptTrack — UI/UX dönüşüm planlama paketi

**Amaç:** Expo tabanlı SubscriptTrack uygulamasının arayüzünü ve ürün deneyimini uçtan uca iyileştirmek. Bu paket **kod değiştirme talimatı değil**, doğrulanabilir bir plan üretme sürecidir.

## Çalışma modeli

- **Ürün/tasarım yönü:** `01-PRODUCT-AND-DESIGN-BRIEF.md` + `02-DECISIONS-AND-GUARDRAILS.md`.
- **Codex araştırma aşaması (salt okunur):** `03-CODEX-AUDIT-PROMPT.md` içeriğini Codex'e ilet. Depoya yazma, paket kurma, build/config değiştirme, push/commit/deploy yok.
- **Gözden geçirme:** Audit çıktısındaki gerçekler, belirsizlikler ve ürün kararları incelenir; puanlar kanıt ve ekran görüntüsüne dayalı sunulur.
- **Codex planlama aşaması:** Audit onayından sonra `04-CODEX-PLAN-PROMPT.md` verilir. Sadece Markdown plan dosyaları üretilebilir; uygulama koduna dokunulmaz.
- **Plan kabulü:** `05-REVIEW-AND-ACCEPTANCE.md` ile kapsam, görsel kalite, cihaz testi ve riskler doğrulanır.
- **Sprint yürütme:** Ancak onaydan sonra `06-CODEX-SPRINT-EXECUTION-PROMPT.md` tek tek sprintler için kullanılır.

## Hedef depo

`https://github.com/subscription-tracking/SubscriptTrack`

Codex'in **güncel** main/çalışma ağacı ve mevcut kullanıcı değişikliklerini tespit etmesi gerekir. Önceki sohbetin ekran/kod incelemesi güncel kod kanıtının yerini tutmaz.

## Önerilen çıktı yeri

Audit onayı verilene kadar Codex **dosya oluşturmasın**. Plan yazma izni verildiğinde önerilen konum:

`docs/plans/uiux-transformation/`

Doküman dosyaları mevcut doküman sistemine uyumlu eklenmeli; `docs/CURRENT_STATUS.md` otomatik olarak 'tamamlandı' işaretlenmemeli.

## Öncelikli hedef

**Önce ana sayfa görsel sistemi + işlevsel bilgi hiyerarşisi**, sonra tüm rota ve durumlara ölçekleme. “Daha çok gradient, glow, 3D, blur, animasyon” kendi başına başarı değildir. Tasarım özgün, okunabilir, hızlı ve gerçeğe sadık olmalıdır.
