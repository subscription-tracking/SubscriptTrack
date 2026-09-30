import 'package:flutter/material.dart';

import '../widgets/legal_document.dart';

/// S44: uygulama içi gizlilik politikası erişimi. Bu metin bir taslaktır —
/// SPRINT_31_34_RELEASE_EVIDENCE.md'deki S34 "Privacy policy... yayını" dış
/// hukuki inceleme/onay adımının yerine geçmez; yalnızca mağaza gereksinimi
/// olan "uygulama içinden erişilebilir gizlilik politikası" varlığını sağlar.
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const _summary = <String>[
    'Yalnızca abonelik takibi için gerekli verileri saklarız.',
    'Verilerini reklam veya pazarlama amacıyla satmayız.',
    'Verini dışa aktarabilir veya hesabını kalıcı olarak silebilirsin.',
  ];

  static const _sections = <LegalSection>[
    LegalSection(
      title: 'Hangi verileri topluyoruz',
      body: 'Hesabını oluşturduğunda e-posta adresini; uygulamayı kullanırken '
          'eklediğin abonelik kayıtlarını (servis adı, tutar, para birimi, '
          'yenileme sıklığı, kategori, notlar), ödeme yöntemi adlarını '
          '(gerçek kart bilgisi değil, yalnızca senin verdiğin bir isim) ve '
          'hatırlatma tercihlerini saklarız.',
    ),
    LegalSection(
      title: 'Verilerini nerede saklıyoruz',
      body: 'Verilerin Supabase altyapısında güvenli biçimde saklanır. '
          'Abonelik kayıtların hesabına bağlıdır. Diğer kullanıcılar bu '
          'kayıtlara erişemez.',
    ),
    LegalSection(
      title: 'Verilerini nasıl paylaşıyoruz',
      body: 'Abonelik verilerini reklam, analiz veya pazarlama amacıyla '
          'üçüncü taraflarla paylaşmayız veya satmayız. Veriler yalnızca '
          'uygulamanın çalışması için altyapı sağlayıcımız Supabase '
          'tarafından işlenir.',
    ),
    LegalSection(
      title: 'Bildirimler',
      body:
          'Yenileme hatırlatmaları cihazında zamanlanır; bildirim içeriği cihazından '
          'dışarı gönderilmez.',
    ),
    LegalSection(
      title: 'Hakların (KVKK)',
      body: '6698 sayılı KVKK kapsamında verilerine erişme, düzeltme ve '
          'silme hakkına sahipsin. Verilerini istediğin an Ayarlar → '
          'Gizlilik ve veri merkezi → "Verilerimi dışa aktar" ile '
          'indirebilir, "Hesabımı ve verilerimi sil" ile hesabınla '
          'birlikte kalıcı olarak silebilirsin.',
    ),
    LegalSection(
      title: 'İletişim',
      body: 'Gizlilikle ilgili sorular için uygulama içindeki "Geri '
          'bildirim gönder" ekranını kullanabilirsin.',
    ),
  ];

  @override
  Widget build(BuildContext context) => const LegalDocumentScreen(
        title: 'Gizlilik Politikası',
        version: '1.0',
        lastUpdated: '20 Eylül 2026',
        summary: _summary,
        sections: _sections,
      );
}
