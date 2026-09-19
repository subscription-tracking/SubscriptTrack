import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../data/csv_import_parser.dart';
import '../../domain/subscription_models.dart';
import '../../presentation/subscription_controller.dart';

/// Parser'ın (csv_import_parser.dart) gerçekte beklediği başlıklarla birebir
/// eşleşir — "Veri dışa aktar" ekranının ürettiği Türkçe başlıklarla (Ad,
/// Tutar, ...) AYNI DEĞİL; o dosya bugün olduğu haliyle tekrar içe
/// aktarılamaz. Şablon bilerek gerçek parser formatını gösteriyor.
const _csvTemplate =
    'name,amount,currency,billing_cycle,next_renewal_date,category\n'
    'Netflix,149.99,TRY,monthly,2026-10-16,streaming\n'
    'Spotify,59.99,TRY,monthly,2026-10-20,music';

class CsvImportScreen extends StatefulWidget {
  const CsvImportScreen({required this.controller, super.key});
  final SubscriptionController controller;

  @override
  State<CsvImportScreen> createState() => _CsvImportScreenState();
}

class _CsvImportScreenState extends State<CsvImportScreen> {
  CsvImportResult? _result;
  bool _importing = false;

  Future<void> _pick() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv'],
      withData: true,
    );
    if (picked == null || picked.files.single.bytes == null) return;
    setState(() => _result = CsvImportParser.parse(
        utf8.decode(picked.files.single.bytes!, allowMalformed: true)));
  }

  Future<void> _import() async {
    final result = _result;
    if (result == null || result.rows.isEmpty) return;
    setState(() => _importing = true);
    var added = 0;
    for (final row in result.rows) {
      final ok = await widget.controller.add(
        name: row.name,
        amount: row.amount,
        currency: row.currency,
        billingCycle: row.billingCycle,
        startDate: DateTime.now(),
        nextRenewalDate: row.nextRenewalDate,
        category: row.category,
      );
      if (ok) added++;
    }
    if (!mounted) return;
    setState(() => _importing = false);
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$added abonelik içe aktarıldı.')));
    Navigator.pop(context);
  }

  void _showTemplate() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Örnek CSV formatı'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Sütunlar: name, amount, currency, billing_cycle, '
                'next_renewal_date (YYYY-AA-GG), category',
              ),
              const SizedBox(height: 12),
              Container(
                width: double.maxFinite,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const SelectableText(_csvTemplate,
                    style: TextStyle(fontFamily: 'monospace', fontSize: 12)),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              await Clipboard.setData(const ClipboardData(text: _csvTemplate));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Örnek panoya kopyalandı.')));
                Navigator.pop(context);
              }
            },
            child: const Text('Panoya kopyala'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Kapat'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final result = _result;
    return Scaffold(
      appBar: AppBar(title: const Text('CSV içe aktar')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: result == null
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FilledButton.icon(
                        onPressed: _pick,
                        icon: const Icon(Icons.upload_file),
                        label: const Text('CSV dosyası seç')),
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: _showTemplate,
                      icon: const Icon(Icons.description_outlined, size: 18),
                      label: const Text('Örnek format nasıl olmalı?'),
                    ),
                  ],
                ),
              )
            : ListView(children: [
                Text('${result.rows.length} geçerli kayıt',
                    style: Theme.of(context).textTheme.titleMedium),
                if (result.errors.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text('${result.errors.length} satır aktarılmadı',
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error)),
                  ...result.errors.map((e) =>
                      Text(e, style: Theme.of(context).textTheme.bodySmall)),
                ],
                const SizedBox(height: 16),
                ...result.rows.map((row) => ListTile(
                    title: Text(row.name),
                    subtitle: Text(
                        '${row.amount.amount} ${row.currency} · ${row.billingCycle.label}'))),
                const SizedBox(height: 16),
                FilledButton(
                    onPressed: _importing ? null : _import,
                    child: Text(_importing
                        ? 'İçe aktarılıyor...'
                        : 'Geçerli kayıtları içe aktar')),
                TextButton(
                    onPressed: _importing ? null : _pick,
                    child: const Text('Başka dosya seç')),
              ]),
      ),
    );
  }
}
