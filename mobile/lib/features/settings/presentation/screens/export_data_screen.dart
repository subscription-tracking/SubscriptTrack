import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class ExportDataScreen extends StatelessWidget {
  const ExportDataScreen({required this.subscriptions, super.key});

  final SubscriptionController subscriptions;

  String _buildCsv() {
    final buf = StringBuffer();
    buf.writeln('Ad,Tutar,Para Birimi,Döngü,Kategori,Sonraki Yenileme,Notlar');
    for (final s in subscriptions.active) {
      buf.writeln(
        '"${s.name}",${s.amount},${s.currency},'
        '${s.billingCycle.label},${s.category.label},'
        '${DateTimeUtils.formatDate(s.nextRenewalDate)},'
        '"${s.notes ?? ''}"',
      );
    }
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Veri dışa aktar')),
      body: ListenableBuilder(
        listenable: subscriptions,
        builder: (context, _) {
          final csv = _buildCsv();
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(Icons.table_chart_outlined,
                            color:
                                Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 12),
                        const Text('CSV Formatı',
                            style:
                                TextStyle(fontWeight: FontWeight.bold)),
                      ]),
                      const SizedBox(height: 8),
                      Text(
                        '${subscriptions.active.length} aktif abonelik',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: subscriptions.active.isEmpty
                    ? null
                    : () async {
                        await Clipboard.setData(
                            ClipboardData(text: csv));
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                  'CSV panoya kopyalandı. Bir metin editörüne yapıştırıp .csv olarak kaydet.'),
                            ),
                          );
                        }
                      },
                icon: const Icon(Icons.copy),
                label: const Text('CSV\'yi panoya kopyala'),
              ),
              const SizedBox(height: 16),
              const Text(
                'Not: Dosyaya kaydetme özelliği Supabase entegrasyonu tamamlandığında eklenecek.',
                style: TextStyle(fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],
          );
        },
      ),
    );
  }
}
