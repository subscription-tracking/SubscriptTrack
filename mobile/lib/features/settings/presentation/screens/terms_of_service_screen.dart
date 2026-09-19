import 'package:flutter/material.dart';

/// S44: uygulama içi kullanım şartları erişimi. Bu metin bir taslaktır —
/// SPRINT_31_34_RELEASE_EVIDENCE.md'deki S34 dış hukuki inceleme/onay adımının
/// yerine geçmez; yalnızca mağaza gereksinimi olan "uygulama içinden
/// erişilebilir kullanım şartları" varlığını sağlar.
class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  static const _lastUpdated = '20 Eylül 2026';

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Kullanım Şartları')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Son güncelleme: $_lastUpdated', style: text.bodySmall),
          const SizedBox(height: 20),
          const _Section(
            title: 'Hizmetin kapsamı',
            body:
                'SubscriptTrack, aboneliklerini takip etmene, yenileme tarihlerini '
                'görmene ve harcamalarını analiz etmene yardımcı olan bir kişisel '
                'finans takip aracıdır. Uygulama üzerinden gerçek bir ödeme veya '
                'abonelik satın alma/iptal işlemi yapılmaz — yalnızca senin '
                'girdiğin bilgileri kaydeder ve hatırlatır.',
          ),
          const _Section(
            title: 'Hesabın',
            body:
                'Hesabını oluştururken doğru bir e-posta adresi kullanmalısın. '
                'Hesabının ve şifrenin güvenliğinden sen sorumlusun.',
          ),
          const _Section(
            title: 'Girdiğin veriler',
            body:
                'Uygulamaya girdiğin abonelik bilgilerinin (tutar, tarih, servis '
                'adı vb.) doğruluğundan sen sorumlusun. Uygulama bu bilgilere '
                'dayanarak hesaplama ve hatırlatma yapar; üçüncü taraf servis '
                'sağlayıcılarının (Netflix, Spotify vb.) gerçek fatura/faturalama '
                'bilgisiyle otomatik senkronize olmaz.',
          ),
          const _Section(
            title: 'Sorumluluk sınırı',
            body:
                'Hatırlatma bildirimleri cihaz ayarlarına, izinlere ve işletim '
                'sistemi davranışına bağlıdır; bir bildirimin gecikmesi veya '
                'iletilmemesi durumunda oluşabilecek maddi kayıplardan uygulama '
                'sorumlu tutulamaz. Uygulama "olduğu gibi" sunulur.',
          ),
          const _Section(
            title: 'Hesap silme',
            body:
                'Ayarlar → Gizlilik ve veri merkezi → "Hesabımı ve verilerimi '
                'sil" üzerinden hesabını ve tüm verilerini kalıcı olarak '
                'silebilirsin. Bu işlem geri alınamaz.',
          ),
          const _Section(
            title: 'Değişiklikler',
            body:
                'Bu şartlar zaman zaman güncellenebilir; önemli değişiklikler '
                'uygulama içinde bildirilir.',
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(body, style: text.bodyMedium?.copyWith(height: 1.5)),
        ],
      ),
    );
  }
}
