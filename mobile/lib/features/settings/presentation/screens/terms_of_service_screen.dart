import 'package:flutter/material.dart';

import '../widgets/legal_document.dart';

/// S44: uygulama içi kullanım şartları erişimi. Bu metin bir taslaktır —
/// SPRINT_31_34_RELEASE_EVIDENCE.md'deki S34 dış hukuki inceleme/onay adımının
/// yerine geçmez; yalnızca mağaza gereksinimi olan "uygulama içinden
/// erişilebilir kullanım şartları" varlığını sağlar.
class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  static const _summary = <String>[
    'Uygulama aboneliklerini takip eder; ödeme veya iptal işlemi yapmaz.',
    'Girdiğin abonelik bilgilerinin doğruluğu sana aittir.',
    'Hesabını ve verilerini Ayarlar içinden kalıcı olarak silebilirsin.',
  ];

  static const _sections = <LegalSection>[
    LegalSection(
      title: 'Hizmetin kapsamı',
      body: 'SubscriptTrack, aboneliklerini takip etmene, yenileme tarihlerini '
          'görmene ve harcamalarını analiz etmene yardımcı olan bir kişisel '
          'finans takip aracıdır. Uygulama üzerinden gerçek bir ödeme veya '
          'abonelik satın alma/iptal işlemi yapılmaz — yalnızca senin '
          'girdiğin bilgileri kaydeder ve hatırlatır.',
    ),
    LegalSection(
      title: 'Hesabın',
      body: 'Hesabını oluştururken doğru bir e-posta adresi kullanmalısın. '
          'Hesabının ve şifrenin güvenliğinden sen sorumlusun.',
    ),
    LegalSection(
      title: 'Girdiğin veriler',
      body: 'Uygulamaya girdiğin abonelik bilgilerinin (tutar, tarih, servis '
          'adı vb.) doğruluğundan sen sorumlusun. Uygulama bu bilgilere '
          'dayanarak hesaplama ve hatırlatma yapar; üçüncü taraf servis '
          'sağlayıcılarının (Netflix, Spotify vb.) gerçek fatura/faturalama '
          'bilgisiyle otomatik senkronize olmaz.',
    ),
    LegalSection(
      title: 'Sorumluluk sınırı',
      body: 'Hatırlatma bildirimleri cihaz ayarlarına, izinlere ve işletim '
          'sistemi davranışına bağlıdır; bir bildirimin gecikmesi veya '
          'iletilmemesi durumunda oluşabilecek maddi kayıplardan uygulama '
          'sorumlu tutulamaz. Uygulama "olduğu gibi" sunulur.',
    ),
    LegalSection(
      title: 'Hesap silme',
      body: 'Ayarlar → Gizlilik ve veri merkezi → "Hesabımı ve verilerimi '
          'sil" üzerinden hesabını ve tüm verilerini kalıcı olarak '
          'silebilirsin. Bu işlem geri alınamaz.',
    ),
    LegalSection(
      title: 'Değişiklikler',
      body: 'Bu şartlar zaman zaman güncellenebilir; önemli değişiklikler '
          'uygulama içinde bildirilir.',
    ),
  ];

  @override
  Widget build(BuildContext context) => const LegalDocumentScreen(
        title: 'Kullanım Şartları',
        version: '1.0',
        lastUpdated: '20 Eylül 2026',
        summary: _summary,
        sections: _sections,
      );
}
