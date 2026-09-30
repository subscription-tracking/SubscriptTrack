import 'package:flutter/material.dart';

import '../../../../shared/design/responsive.dart';

/// Yasal belgedeki tek bölüm (başlık + paragraf).
class LegalSection extends StatelessWidget {
  const LegalSection({required this.title, required this.body, super.key});

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

/// Gizlilik politikası ve kullanım şartlarının ortak sayfa iskeleti:
/// sürüm satırı, "Kısa özet" kartı ve bölüm listesi.
class LegalDocumentScreen extends StatelessWidget {
  const LegalDocumentScreen({
    required this.title,
    required this.version,
    required this.lastUpdated,
    required this.summary,
    required this.sections,
    super.key,
  });

  final String title;
  final String version;
  final String lastUpdated;
  final List<String> summary;
  final List<LegalSection> sections;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ResponsiveCenter(
        child: SelectionArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text('Belge sürümü $version · Son güncelleme: $lastUpdated',
                  style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 20),
              _SummaryCard(items: summary),
              const SizedBox(height: 24),
              ...sections,
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.items});

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
