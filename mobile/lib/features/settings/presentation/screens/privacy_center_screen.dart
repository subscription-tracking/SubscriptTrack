import 'package:flutter/material.dart';

import '../../../auth/presentation/auth_controller.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import 'delete_account_screen.dart';
import 'export_data_screen.dart';

class PrivacyCenterScreen extends StatelessWidget {
  const PrivacyCenterScreen(
      {required this.auth, required this.subscriptions, super.key});
  final AuthController auth;
  final SubscriptionController subscriptions;

  @override
  Widget build(BuildContext context) {
    final error = Theme.of(context).colorScheme.error;
    return Scaffold(
      appBar: AppBar(title: const Text('Gizlilik ve veri merkezi')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Verilerin kontrolü sende',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    const Text(
                        'Aboneliklerin ve tasarruf kayıtların yalnızca hesabınla ilişkilidir. RLS ile diğer kullanıcılar bu verilere erişemez.'),
                  ]),
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            leading: const Icon(Icons.download_outlined),
            title: const Text('Verilerimi dışa aktar'),
            subtitle: const Text('CSV olarak paylaş veya panoya kopyala'),
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                    builder: (_) =>
                        ExportDataScreen(subscriptions: subscriptions))),
          ),
          ListTile(
            leading: Icon(Icons.delete_forever_outlined, color: error),
            title: Text('Hesabımı ve verilerimi sil',
                style: TextStyle(color: error)),
            subtitle: const Text('Bu işlem geri alınamaz'),
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                    builder: (_) => DeleteAccountScreen(auth: auth))),
          ),
        ],
      ),
    );
  }
}
