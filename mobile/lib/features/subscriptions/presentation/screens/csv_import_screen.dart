import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../data/csv_import_parser.dart';
import '../../domain/subscription_models.dart';
import '../../presentation/subscription_controller.dart';

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

  @override
  Widget build(BuildContext context) {
    final result = _result;
    return Scaffold(
      appBar: AppBar(title: const Text('CSV içe aktar')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: result == null
            ? Center(
                child: FilledButton.icon(
                    onPressed: _pick,
                    icon: const Icon(Icons.upload_file),
                    label: const Text('CSV dosyası seç')))
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
