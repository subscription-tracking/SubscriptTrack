# Onaylanmış ürün kararları ve değiştirilmeyecek sınırlar

## Kullanıcının onayladığı kararlar

1. **Expo ana mobil üründür.** Flutter geçiş iki platformda kabul edilene kadar korunur; doğrudan Flutter UI değişikliği yapma.
2. **Birincil öncelik UI/UX ve ürün deneyimidir.** Yeni özellik eklemek bu çalışmanın varsayılan hedefi değildir.
3. **İstendiğinde kalıcı abonelik silme mümkün olmalıdır.** Ancak UI ve backend semantiği netleştirilmeden uygulanmaz; varsayılan kullanıcı yolu geri alınabilir mantıksal silme/arşivleme olabilir.
4. **Web sitesi bağımsız tanıtım + SEO + destek + yasal içeriktir.** Mobil uygulamanın tam web dashboard kopyası değildir; Flutter web preview bu ürünün yerine geçmez.
5. **Kullanıcı onayı olmadan gecikmiş yenileme tarihi sessizce ilerletilmez.** Ödeme/yenileme işlemleri ilgili kullanıcı eylemine dayanır.
6. **Yayın hedefi Android ve iOS birlikte.** Expo JS export iOS native kabulünün yerine geçmez.

## Kritik davranış sınırları

- Aynı Supabase projesi, Auth, PostgREST, RLS, RPC ve Edge Functions. Planlama safhasında canlı backend'e yazma yok.
- `Money` minor unit/decimal yaklaşımı korunur. TRY/USD/EUR ve diğer desteklenen para birimleri toplamda birbirine dönüştürülmez.
- Fiyat/ödeme/geçmiş ve yenileme algısı görsel makyaj uğruna değiştirilemez.
- Offline cache/FIFO, hesap izolasyonu, PIN, oturum yönetimi, bildirim, timezone ve feature flag'ler kırılmayacak.
- RLS/SECURITY DEFINER/idempotency kontrolleri bypass edilmez.
- UX tasarımında mantıksal silme, kalıcı abonelik silme, hesap silme ve geçmişin saklanması farklı eylemlerdir.
- Eski istemcilerle uyumluluk ve yanlışlıkla veri kaybı tasarım konusudur; yalnız UI değildir.

## Kalıcı silme için ayrıca karar gerektiren noktalar

- Kalıcı silmede ödeme olayları, tasarruf geçmişi, bildirim geçmişi ve denetim olayları ne olacak?
- İşlem çevrimdışı mümkün mü, yoksa yalnız sunucu onayından sonra mı tamam sayılmalı?
- RLS/foreign key/cascade ile eski Flutter sürümünün davranışı nasıl sınırlandırılacak?
- Yasal saklama/kişisel veri politikası ve kullanıcıya geri alınamazlık uyarısı nasıl sunulacak?

Bu sorular netleşmeden Codex yalnız **tasarım ve teknik karar seçenekleri** oluştursun; kalıcı silme API'si yazmasın.

## Yasaklar (planlama boyunca)

- Uygulama kaynak kodu, lockfile, migration, `.env`, release, Supabase cloud, CI ve iş akışı değiştirmek.
- Push, commit, paket kurmak, migration uygulamak, kullanıcı verisi okumak/yazmak.
- Önceki raporlardaki “Kod tamam” veya test sayısını güncel ve doğrulanmış gerçek diye sunmak.
- AI slop görüntüsü: rastgele yıldız/sparkle/glitter, gereksiz glow/neon/gradient ve dekoratif sahte grafikler.
