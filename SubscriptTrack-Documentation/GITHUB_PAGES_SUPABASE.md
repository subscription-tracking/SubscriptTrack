# GitHub Pages + Supabase Web Önizlemesi

Bu proje GitHub Pages üzerinde canlı bir Flutter Web önizlemesi yayınlayabilir. Adres:

`https://krayirhan.github.io/SubscriptTrack/`

Bu yayın, mobil uygulamanın tarayıcı hedefidir; ürün için web tabanlı abonelik dashboard'u değildir.

## Bir defalık GitHub ayarları

1. GitHub deposunda **Settings → Pages** bölümünü açın.
2. **Build and deployment / Source** olarak **GitHub Actions** seçin.
3. **Settings → Secrets and variables → Actions** bölümünde şu repository secret'larını ekleyin:

   | Secret | Değer |
   |---|---|
   | `SUPABASE_URL` | Supabase Project URL |
   | `SUPABASE_ANON_KEY` | Supabase `anon` veya publishable key |

4. `main` dalına gönderim yapın veya **Actions → Deploy web preview → Run workflow** ile manuel çalıştırın.

Workflow, secret'lardan Flutter'ın `--dart-define` değerlerini üretir ve `mobile/build/web` çıktısını Pages'e yollar. Secret eksikse bilinçli olarak başarısız olur; yanlışlıkla yerel modun canlıya yayınlanmasını engeller.

## Supabase ayarları

Supabase Dashboard'da **Authentication → URL Configuration** bölümünü açın:

- **Site URL:** `https://krayirhan.github.io/SubscriptTrack/`
- **Redirect URLs:**
  - `https://krayirhan.github.io/SubscriptTrack/`
  - Yerel geliştirme için kullandığınız adres (ör. `http://localhost:*/`)

Bu ayar, e-posta doğrulama ve şifre sıfırlama bağlantılarının canlı uygulamaya dönmesi için gereklidir. Google/Apple gibi OAuth sağlayıcıları sonradan etkinleştirilirse aynı Pages adresi ilgili sağlayıcının callback/redirect listesine de eklenmelidir.

## Güvenlik notu

`SUPABASE_ANON_KEY` veya publishable key tarayıcı uygulamasının içine derlenir; bu normaldir ve gizli bir servis anahtarı değildir. Erişim kontrolü Supabase RLS politikalarıyla sağlanır. `service_role` anahtarını GitHub secret olarak bile bu workflow'a eklemeyin ve hiçbir istemci build'ine koymayın.

## Güncelleme akışı

`main` dalında `mobile/` veya deployment workflow'u değiştiğinde GitHub Actions otomatik yeni bir preview yayınlar. Yayın URL'si Actions çalışmasının `deploy` adımında görünür.
