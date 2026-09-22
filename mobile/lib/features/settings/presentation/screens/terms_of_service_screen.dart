import 'package:flutter/material.dart';

import '../../../../shared/design/responsive.dart';

/// S44: uygulama içi kullanım şartları erişimi. Bu metin bir taslaktır —
/// SPRINT_31_34_RELEASE_EVIDENCE.md'deki S34 dış hukuki inceleme/onay adımının
/// yerine geçmez; yalnızca mağaza gereksinimi olan "uygulama içinden
/// erişilebilir kullanım şartları" varlığını sağlar.
class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  static const _lastUpdated = '20 Eylül 2026';
  static const _version = '1.0';

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Kullanım Şartları')),
      body: ResponsiveCenter(
        child: SelectionArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text('Belge sürümü $_version · Son güncelleme: $_lastUpdated',
                  style: text.bodySmall),
              const SizedBox(height: 20),
              const _LegalSummary(
                items: [
                  'Uygulama aboneliklerini takip eder; ödeme veya iptal işlemi yapmaz.',
                  'Girdiğin abonelik bilgilerinin doğruluğu sana aittir.',
                  'Hesabını ve verilerini Ayarlar içinden kalıcı olarak silebilirsin.',
                ],
              ),
              const SizedBox(height: 24),
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
        ),
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
          Semantics(
            header: true,
            child: Text(title,
                style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 8),
          Text(body, style: text.bodyMedium?.copyWith(height: 1.5)),
        ],
      ),
    );
  }
}

class _LegalSummary extends StatelessWidget {
  const _LegalSummary({required this.items});
  final List<String> items;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Kısa özet',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text('• $item'),
                )),
          ]),
        ),
      );
}
