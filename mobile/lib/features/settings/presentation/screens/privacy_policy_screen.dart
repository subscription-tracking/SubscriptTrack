import 'package:flutter/material.dart';

import '../../../../shared/design/responsive.dart';

/// S44: uygulama içi gizlilik politikası erişimi. Bu metin bir taslaktır —
/// SPRINT_31_34_RELEASE_EVIDENCE.md'deki S34 "Privacy policy... yayını" dış
/// hukuki inceleme/onay adımının yerine geçmez; yalnızca mağaza gereksinimi
/// olan "uygulama içinden erişilebilir gizlilik politikası" varlığını sağlar.
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const _lastUpdated = '20 Eylül 2026';
  static const _version = '1.0';

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Gizlilik Politikası')),
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
                  'Yalnızca abonelik takibi için gerekli verileri saklarız.',
                  'Verilerini reklam veya pazarlama amacıyla satmayız.',
                  'Verini dışa aktarabilir veya hesabını kalıcı olarak silebilirsin.',
                ],
              ),
              const SizedBox(height: 24),
              const _Section(
                title: 'Hangi verileri topluyoruz',
                body:
                    'Hesabını oluşturduğunda e-posta adresini; uygulamayı kullanırken '
                    'eklediğin abonelik kayıtlarını (servis adı, tutar, para birimi, '
                    'ödeme döngüsü, kategori, notlar), ödeme yöntemi etiketlerini '
                    '(gerçek kart bilgisi değil, yalnızca senin verdiğin bir isim) ve '
                    'hatırlatma tercihlerini saklarız.',
              ),
              const _Section(
                title: 'Verilerini nerede saklıyoruz',
                body:
                    'Tüm veriler Supabase (PostgreSQL) üzerinde, Row Level Security '
                    '(RLS) politikalarıyla korunur: yalnızca sen kendi verilerine '
                    'erişebilirsin, başka bir kullanıcı ya da uygulama içi rol senin '
                    'aboneliklerini göremez.',
              ),
              const _Section(
                title: 'Verilerini kimseyle paylaşmıyoruz',
                body:
                    'Abonelik verilerini reklam, analiz veya pazarlama amacıyla '
                    'üçüncü taraflarla paylaşmayız veya satmayız. Veriler yalnızca '
                    'uygulamanın çalışması için gerekli altyapı sağlayıcısında '
                    '(Supabase) tutulur.',
              ),
              const _Section(
                title: 'Bildirimler',
                body:
                    'Yenileme hatırlatmaları cihazında yerel olarak zamanlanır '
                    '(flutter_local_notifications); bildirim içeriği cihazından '
                    'dışarı gönderilmez.',
              ),
              const _Section(
                title: 'Haklarınız (KVKK)',
                body:
                    '6698 sayılı KVKK kapsamında verilerine erişme, düzeltme ve '
                    'silme hakkına sahipsin. Verilerini istediğin an Ayarlar → '
                    'Gizlilik ve veri merkezi → "Verilerimi dışa aktar" ile '
                    'indirebilir, "Hesabımı ve verilerimi sil" ile hesabınla '
                    'birlikte kalıcı olarak silebilirsin.',
              ),
              const _Section(
                title: 'İletişim',
                body: 'Gizlilikle ilgili sorular için uygulama içindeki "Geri '
                    'bildirim gönder" ekranını kullanabilirsin.',
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
