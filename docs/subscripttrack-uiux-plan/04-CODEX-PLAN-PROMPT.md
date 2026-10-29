# Codex — Faz 2: Uçtan uca plan üretimi (yalnız Markdown)

ÖNKOŞUL: Faz 1 salt okunur audit incelendi ve gerekli ürün kararları onaylandı. Bu aşamada **uygulama kodu değişmeyecek**. Yalnız plan dokümanları oluşturulabilir; önce `git status` ve yazılacak dosyaların varlığını kontrol et. Mevcut dokümanları ezme. Kullanıcı değişikliklerini koru.

Kullanıcı hedefleri:
- Expo ana ürün, Flutter korunacak.
- UI/UX önce; premium, sakin, marka özgünlüğü yüksek, bağlama göre değişen ekran kompozisyonu.
- Kalıcı silme istenirse mümkün olacak; veri yaşam döngüsü için ayrıca açık karar/uyumluluk planı.
- Web ayrı tanıtım/SEO/destek/yasal ürün.
- Sessiz yenileme kesinlikle yok.
- Android/iOS birlikte yayın hedefi.

FAZ 1 denetimindeki gerçek dosya yollarını ve kanıtları kullanarak `docs/plans/uiux-transformation/` içine şu belgeleri tasarla/oluştur (konum/dosya çakışması varsa önce raporla):

1. `00-INDEX.md`: kapsam, sürüm, HEAD, kanıt türleri, bağımlılık ve sprint haritası.
2. `01-DESIGN-DIRECTION.md`: tasarım ilkeleri, anti-AI-slop kontrolü, marka tonu, tipografi, renk semantiği, bileşen varyantları, motion/haptics/ikon standardı, açık/koyu tema, erişilebilirlik.
3. `02-SCREEN-INVENTORY.md`: tüm rotalar + kullanıcı hedefi + varsayılan/loading/empty/error/offline/az/çok veri + tasarım problemi + çözüm + test eşleşmesi.
4. `03-COMPONENT-ARCHITECTURE.md`: mevcut shared katman korunarak primitive/composite/pattern bileşen haritası, API'ler, yeniden kullanım, hangi dosyalar etkilenecek.
5. `04-OSS-LICENSE-DEPENDENCIES.md`: ADOPT/EVALUATE/AVOID seçenekleri; paket ve SDK sürümü, güncel resmi lisans URL'i, transitive asset/font lisansları, Expo Go/native build, RN/iOS/Android, ek yük ve alternatifleri.
6. `05-SPRINT-BACKLOG.md`: S0 audit kapanışı, S1 foundations, S2 dashboard, S3 subscriptions/detail/form, S4 stats/calendar/notifications, S5 auth/onboarding/settings/privacy, S6 interactions/perf/a11y, S7 cross-platform QA/release visual gate; bağımsız web track. Sprintleri bağımlılık sırası ve kabul kriterlerine göre böl. **Her sprint için** ticket ID, önkoşul, kapsam/kapsam dışı, tam dosyalar, hedef tasarım, test/cihaz kanıtı, risk, geri dönüş ve Definition of Done ver.
7. `06-ACCEPTANCE-MATRIX.md`: Android+iOS, açık+koyu, küçük+büyük ekran, font scaling, TalkBack/VoiceOver, reduce motion, 0/1/çok kayıt, TRY/USD/EUR, trial, gecikmiş, cancelled, archived, offline/queue, auth değişimi, notification/deep link.
8. `07-ROLLBACK-AND-MIGRATION-RISKS.md`: görsel değişikliklerin domain yan etkileri, feature flag'ler, eski Flutter uyumu, hesap/silme/yenileme korumaları; kesinlikle backend migration'ı bu sprintlerde kendiliğinden uygulama.
9. `08-DECISION-LOG.md`: açık kararlar, onay sahibi, gerekçe, seçenekler ve karar tarihi boş şablonu.
10. `09-VALIDATION-REPORT-TEMPLATE.md`: önce/sonra ekran fotoğrafı, senaryo, test, kabul, açık issue, regresyon, licencing ve ölçümler için boş şablon.

ZORUNLU KALİTE:
- Uygulamadaki veriye dayanmayan sahte finansal trend/grafik/ödeme durumu kullanma.
- Sırf görsel iyileştirme için tüm ekranları birbirinin aynı büyük kart şablonuna dönüştürme.
- `expo/` kodu, `mobile/`, backend, Supabase, lockfile, CI, Git gibi uygulama alanlarını değiştirme.
- Plan ayrıntısı uygulanabilir olmalı: “Hero'yu güzelleştir” gibi görev kabul edilmez. Hangi mevcut bileşenin nasıl değişeceği, varyantlar, empty/offline/error ve test kriteri yazılmalı.
- Her dosyanın kanıtını kaynak path/line ile bağla; yeni kodun var olduğunu varsayma.
- Sonunda dokümanların kısa özetini, oluşan dosyaları, bilerek el sürülmeyen alanları, karar bekleyen noktaları raporla. Commit/push yapma.
