import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';

import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../data/supabase_export_repository.dart';

class ExportDataScreen extends StatelessWidget {
  const ExportDataScreen({required this.subscriptions, super.key});

  final SubscriptionController subscriptions;

  String _csvField(String value) => '"${value.replaceAll('"', '""')}"';

  String _buildCsv() {
    const eol = '\r\n';
    final buf = StringBuffer();
    buf.write(
      [
        'name',
        'amount',
        'currency',
        'billing_cycle',
        'next_renewal_date',
        'category',
        'status',
        'notes',
        'payment_method',
        'trial_end_date',
        'trial_price_after',
      ].map(_csvField).join(','),
    );
    buf.write(eol);
    for (final s in [
      ...subscriptions.active,
      ...subscriptions.paused,
      ...subscriptions.cancelled,
    ]) {
      buf.write(
        [
          s.name,
          s.amount.amount.toStringAsFixed(2),
          s.currency,
          s.billingCycle.key,
          s.nextRenewalDate.toIso8601String().substring(0, 10),
          s.category.key,
          s.status.key,
          s.notes ?? '',
          s.paymentMethod ?? '',
          s.trialEndDate?.toIso8601String().substring(0, 10) ?? '',
          s.trialPriceAfter?.decimalString ?? '',
        ].map(_csvField).join(','),
      );
      buf.write(eol);
    }
    return buf.toString();
  }

  Future<void> _shareAsFile(BuildContext context) async {
    final csv = _buildCsv();
    // Avoid dart:io on web — use share_plus's text share instead.
    await Share.share(
      csv,
      subject: 'SubscriptTrack Abonelik Verisi',
    );
  }

  Future<void> _copyToClipboard(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: _buildCsv()));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('CSV panoya kopyalandı.')),
      );
    }
  }

  Future<void> _createCloudExport(BuildContext context) async {
    try {
      final url = await SupabaseExportRepository().createAndProcess();
      await Share.share(url,
          subject: 'SubscriptTrack güvenli export bağlantısı');
    } catch (e) {
      final message = e is ExportException
          ? e.message
          : 'Bulut export şu anda oluşturulamadı. Lütfen tekrar dene.';
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = subscriptions.active.length +
        subscriptions.paused.length +
        subscriptions.cancelled.length;

    return Scaffold(
      appBar: AppBar(title: const Text('Veri dışa aktar')),
      body: ListenableBuilder(
        listenable: subscriptions,
        builder: (context, _) {
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
                            color: Theme.of(context).colorScheme.primary),
                        const SizedBox(width: 12),
                        const Text('İçe aktarılabilir CSV',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                      ]),
                      const SizedBox(height: 8),
                      Text(
                        '$total abonelik; dışa aktarılan dosya tekrar içe aktarılabilir.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              if (!kIsWeb)
                FilledButton.icon(
                  onPressed: total == 0 ? null : () => _shareAsFile(context),
                  icon: const Icon(Icons.share_outlined),
                  label: const Text('Dosya olarak paylaş'),
                  style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48)),
                ),
              if (!kIsWeb) const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed:
                    total == 0 ? null : () => _createCloudExport(context),
                icon: const Icon(Icons.cloud_upload_outlined),
                label: const Text('Güvenli bulut export oluştur'),
                style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48)),
              ),
              if (!kIsWeb) const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: total == 0 ? null : () => _copyToClipboard(context),
                icon: const Icon(Icons.copy),
                label: const Text('Panoya kopyala'),
                style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48)),
              ),
            ],
          );
        },
      ),
    );
  }
}
