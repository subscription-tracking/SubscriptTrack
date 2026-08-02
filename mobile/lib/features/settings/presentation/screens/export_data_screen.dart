import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class ExportDataScreen extends StatelessWidget {
  const ExportDataScreen({required this.subscriptions, super.key});

  final SubscriptionController subscriptions;

  String _csvField(String value) => '"${value.replaceAll('"', '""')}"';

  String _buildCsv() {
    const eol = '\r\n';
    final buf = StringBuffer();
    // RFC 4180: header row quoted, CRLF line endings.
    buf.write(
      [
        'Ad', 'Tutar', 'Para Birimi', 'Döngü',
        'Kategori', 'Durum', 'Sonraki Yenileme', 'Notlar',
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
          s.billingCycle.label,
          s.category.label,
          s.status.label,
          DateTimeUtils.formatDate(s.nextRenewalDate),
          s.notes ?? '',
        ].map(_csvField).join(','),
      );
      buf.write(eol);
    }
    return buf.toString();
  }

  Future<void> _shareAsFile(BuildContext context) async {
    final csv = _buildCsv();
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/subscripttrack_export.csv');
    await file.writeAsString(csv);
    await Share.shareXFiles(
      [XFile(file.path, mimeType: 'text/csv')],
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
                        const Text('CSV Formatı',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                      ]),
                      const SizedBox(height: 8),
                      Text(
                        '$total abonelik (aktif + duraklatıldı + iptal)',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: total == 0 ? null : () => _shareAsFile(context),
                icon: const Icon(Icons.share_outlined),
                label: const Text('Dosya olarak paylaş'),
                style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(48)),
              ),
              const SizedBox(height: 12),
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
