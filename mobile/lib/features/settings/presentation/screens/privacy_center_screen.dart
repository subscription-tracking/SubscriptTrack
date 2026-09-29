import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

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
                        'Aboneliklerin ve tasarruf kayıtların hesabınla ilişkilidir. Bu bilgilere yalnızca sen erişebilirsin.'),
                  ]),
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            leading: const Icon(Icons.policy_outlined),
            title: const Text('Gizlilik Politikası'),
            onTap: () => context.push(AppRoutes.privacyPolicy),
          ),
          ListTile(
            leading: const Icon(Icons.gavel_outlined),
            title: const Text('Kullanım Şartları'),
            onTap: () => context.push(AppRoutes.termsOfService),
          ),
          ListTile(
            leading: const Icon(Icons.download_outlined),
            title: const Text('Verilerimi dışa aktar'),
            subtitle: const Text('CSV olarak paylaş veya panoya kopyala'),
            onTap: () => context.push(AppRoutes.exportData),
          ),
          ListTile(
            leading: Icon(Icons.delete_forever_outlined, color: error),
            title: Text('Hesabımı ve verilerimi sil',
                style: TextStyle(color: error)),
            subtitle: const Text('Bu işlem geri alınamaz'),
            onTap: () => context.push(AppRoutes.deleteAccount),
          ),
        ],
      ),
    );
  }
}
