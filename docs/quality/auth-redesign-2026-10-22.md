# Expo giriş ve kayıt görsel düzeni - 22 Ekim 2026

Login ve register düz tema zemini, küçük marka satırı, kompakt ikon, sola hizalı başlık ve sabit alan etiketlerine geçirildi. Büyük glow/ambient auth süslemeleri kaldırıldı. TextField'a yalnız talep eden ekranlarda kullanılan labelPlacement=above eklendi; diğer ekranlarda floating varsayılanı korunur. Onay metninde küçük tipografi ve tutarlı linkler kullanıldı; eylem yükseklikleri eşitlendi.

TypeScript, lint, mevcut login/kayıt/kurtarma form testleri ve tasarım sistemi kontrolü geçti. Samsung SM-S711B'de Expo Go üzerinden login/register görüntülendi; kayıt formunda parola tekrar alanına odaklanma ve klavye görünümü kontrolü yapıldı. Gerçek giriş/kayıt isteği veya e-posta gönderimi bu görsel turda yapılmadı. Görseller Git dışı `.local/auth-redesign-2026-10-22/` klasöründedir. iOS native ve tüm büyük yazı boyutları kabul edilmedi.

Yerel Metro 8083 kullanıldı; dış 8082 tüneli yeniden başlatılmadı. Dış paylaşılan CI oturumunun yeni kodu sunduğu iddia edilmez. Flutter kaynakları değiştirilmedi.
